import { supabase } from '../config/supabase.js';
import twilio from 'twilio';
import { compileReceiptMessage } from '../utils/messageCompiler.js';

// Initialize the Twilio client using environment variables safely (check they exist to prevent crashes on startup)
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

let twilioClient = null;
if (accountSid && authToken) {
  twilioClient = twilio(accountSid, authToken);
}

const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';
const TWILIO_SMS_NUMBER = process.env.TWILIO_SMS_NUMBER || '+12282844326';

/**
 * Main Service API: Triggered immediately when checkout completes
 */
export const queueOrderNotification = async (order, customer, pdfBuffer, itemsList) => {
  try {
    const phoneNumber = customer?.phone || order.customer_phone;
    if (!phoneNumber) {
      console.warn(`No phone number found for order ${order.order_code}, skipping notification.`);
      return;
    }

    if (!twilioClient) {
      console.warn(`Twilio credentials missing in environment. Logging notification locally.`);
    }

    let invoiceUrl = '';

    // 1. Upload invoice PDF to Supabase Storage if a PDF buffer is supplied
    if (pdfBuffer) {
      try {
        const { data: buckets, error: bucketsErr } = await supabase.storage.listBuckets();
        if (!bucketsErr && buckets) {
          const exists = buckets.some(b => b.name === 'invoices');
          if (!exists) {
            await supabase.storage.createBucket('invoices', {
              public: true,
              allowedMimeTypes: ['application/pdf']
            });
            console.log("Bucket 'invoices' created successfully.");
          }
        }
      } catch (bucketErr) {
        console.error('Error ensuring invoices bucket exists:', bucketErr.message);
      }

      const pdfPath = `receipts/${order.order_code}.pdf`;
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from('invoices')
        .upload(pdfPath, pdfBuffer, {
          contentType: 'application/pdf',
          upsert: true
        });

      if (uploadErr) {
        console.error('Error uploading invoice PDF to Supabase Storage:', uploadErr.message);
      } else {
        // 2. Generate a secure, pre-signed URL (Valid for 7 days)
        const { data: urlData, error: urlErr } = await supabase.storage
          .from('invoices')
          .createSignedUrl(pdfPath, 60 * 60 * 24 * 7);

        if (urlErr) {
          console.error('Error creating pre-signed URL:', urlErr.message);
        } else {
          invoiceUrl = urlData.signedUrl;
        }
      }
    }

    // 3. Log BOTH WhatsApp and SMS notifications inside Database
    const { data: logs, error: logErr } = await supabase
      .from('notification_logs')
      .insert([
        {
          order_id: order.id,
          customer_id: customer?.id || null,
          phone_number: phoneNumber,
          channel: 'whatsapp',
          template_name: 'pos_receipt_confirmation',
          status: 'pending',
          pdf_url: invoiceUrl || null,
          max_retries: 3
        },
        {
          order_id: order.id,
          customer_id: customer?.id || null,
          phone_number: phoneNumber,
          channel: 'sms',
          template_name: 'pos_receipt_confirmation',
          status: 'pending',
          pdf_url: invoiceUrl || null,
          max_retries: 3
        }
      ])
      .select();

    if (logErr) {
      // If table is missing or RLS blocks it, we gracefully fallback to console logging
      console.error('Error logging notification inside DB (Check if notification_logs table is created):', logErr.message);
      // Run the dispatch directly without a database tracking ID if table fails
      if (twilioClient) {
        setImmediate(() => dispatchDirectNotification(order, customer, phoneNumber, invoiceUrl, itemsList));
      }
      return;
    }

    // 4. Asynchronously process delivery if Twilio is set up
    if (twilioClient && logs && logs.length > 0) {
      logs.forEach(log => {
        setImmediate(() => dispatchNotificationJob(log.id, itemsList, customer));
      });
    }

    return logs[0]?.id;
  } catch (error) {
    console.error('Error in queueOrderNotification service:', error.message);
  }
};

/**
 * Worker Core: Twilio Client API Call
 */
const dispatchNotificationJob = async (logId, itemsList, customer) => {
  const { data: log, error: fetchErr } = await supabase
    .from('notification_logs')
    .select('*, orders(*)')
    .eq('id', logId)
    .single();

  if (fetchErr || !log) return;

  try {
    // Format recipient phone number to E.164 (e.g. +917878489640)
    let formattedPhone = log.phone_number.replace(/[^0-9]/g, '');
    if (formattedPhone.length === 10) formattedPhone = `91${formattedPhone}`;
    if (!formattedPhone.startsWith('+')) formattedPhone = `+${formattedPhone}`;

    // Compile custom rich text receipt body
    const compiledMessage = compileReceiptMessage(log.orders, customer, itemsList, log.pdf_url || '');
    let messageResult;

    if (log.channel === 'whatsapp') {
      // 1. Send Rich WhatsApp Message using Twilio
      const msgPayload = {
        from: TWILIO_WHATSAPP_NUMBER,
        to: `whatsapp:${formattedPhone}`,
        body: compiledMessage
      };

      // Only attach media URL if it exists
      if (log.pdf_url) {
        msgPayload.mediaUrl = [log.pdf_url];
      }

      messageResult = await twilioClient.messages.create(msgPayload);
    } else {
      // 2. Fallback SMS Gateway
      messageResult = await twilioClient.messages.create({
        from: TWILIO_SMS_NUMBER,
        to: formattedPhone,
        body: compiledMessage
      });
    }

    // Save success state and Twilio Message SID
    await supabase.from('notification_logs').update({
      status: 'sent',
      provider_message_id: messageResult.sid,
      error_message: null
    }).eq('id', log.id);

  } catch (err) {
    console.error(`Twilio execution error for log ${logId} (channel: ${log.channel}):`, err.message);

    // Standard retry logic with exponential backoff
    const newRetryCount = log.retry_count + 1;
    const shouldRetry = newRetryCount < log.max_retries;

    await supabase.from('notification_logs').update({
      retry_count: newRetryCount,
      status: shouldRetry ? 'pending' : 'failed',
      error_message: err.message
    }).eq('id', log.id);

    if (shouldRetry) {
      const delay = Math.pow(5, newRetryCount) * 1000;
      setTimeout(() => dispatchNotificationJob(logId, itemsList, customer), delay);
    }
  }
};

/**
 * Fallback Direct dispatch if database logger table is missing
 */
const dispatchDirectNotification = async (order, customer, phoneNumber, invoiceUrl, itemsList) => {
  let formattedPhone = phoneNumber.replace(/[^0-9]/g, '');
  if (formattedPhone.length === 10) formattedPhone = `91${formattedPhone}`;
  if (!formattedPhone.startsWith('+')) formattedPhone = `+${formattedPhone}`;

  const compiledMessage = compileReceiptMessage(order, customer, itemsList, invoiceUrl || '');

  // 1. Dispatch WhatsApp
  try {
    const payload = {
      from: TWILIO_WHATSAPP_NUMBER,
      to: `whatsapp:${formattedPhone}`,
      body: compiledMessage
    };
    if (invoiceUrl) {
      payload.mediaUrl = [invoiceUrl];
    }
    await twilioClient.messages.create(payload);
    console.log(`Direct WhatsApp notification sent successfully for order ${order.order_code}`);
  } catch (err) {
    console.error(`Direct WhatsApp notification failed: ${err.message}`);
  }

  // 2. Dispatch SMS
  try {
    await twilioClient.messages.create({
      from: TWILIO_SMS_NUMBER,
      to: formattedPhone,
      body: compiledMessage
    });
    console.log(`Direct SMS sent successfully for order ${order.order_code}`);
  } catch (smsErr) {
    console.error(`Direct SMS failed: ${smsErr.message}`);
  }
};

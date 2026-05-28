import { supabase } from '../config/supabase.js';

// Get Dashboard KPIs (Module 1)
export const getDashboardKPIs = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0,0,0,0);
    const startOfToday = today.toISOString();

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const endOfToday = tomorrow.toISOString();

    // 1. Today's orders and revenue
    const { data: todayOrders, error: ordErr } = await supabase
      .from('orders')
      .select('grand_total, status')
      .eq('workspace_id', req.workspace_id)
      .gte('created_at', startOfToday)
      .lt('created_at', endOfToday)
      .neq('status', 'cancelled');

    if (ordErr) throw ordErr;

    const totalOrdersToday = todayOrders.length;
    const revenueToday = todayOrders.reduce((sum, o) => sum + Number(o.grand_total || 0), 0);

    // 2. Pending Orders queue
    const { count: pendingCount, error: pendErr } = await supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', req.workspace_id)
      .in('status', ['pending', 'preparing', 'ready']);

    if (pendErr) throw pendErr;

    // 3. Low stock alerts
    const { data: materials, error: matErr } = await supabase
      .from('raw_materials')
      .select('id, current_stock, minimum_stock_level')
      .eq('workspace_id', req.workspace_id);

    if (matErr) throw matErr;

    const lowStockAlerts = materials.filter(m => Number(m.current_stock) <= Number(m.minimum_stock_level)).length;

    // 4. Total Customers
    const { count: customerCount, error: custErr } = await supabase
      .from('customers')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', req.workspace_id);

    if (custErr) throw custErr;

    // 5. Net Profit This Month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0,0,0,0);
    const startOfMonStr = startOfMonth.toISOString();

    // This month's orders
    const { data: monthOrders, error: mOrdErr } = await supabase
      .from('orders')
      .select('subtotal, discount_amount, grand_total')
      .eq('workspace_id', req.workspace_id)
      .gte('created_at', startOfMonStr)
      .neq('status', 'cancelled');

    if (mOrdErr) throw mOrdErr;

    // This month's expenses
    const { data: monthExpenses, error: mExpErr } = await supabase
      .from('expenses')
      .select('amount')
      .eq('workspace_id', req.workspace_id)
      .gte('created_at', startOfMonStr);

    if (mExpErr) throw mExpErr;

    // Calculate profit: Net Revenue (grand_total - gst_amount) - Expenses
    // For simplicity, we can do: Grand Total (revenue in pocket) - Monthly Expenses
    const monthRevenue = monthOrders.reduce((sum, o) => sum + Number(o.grand_total || 0), 0);
    const monthExpenseTotal = monthExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const netProfit = monthRevenue - monthExpenseTotal;

    res.json({
      totalOrdersToday,
      revenueToday: Number(revenueToday.toFixed(2)),
      pendingOrders: pendingCount || 0,
      lowStockAlerts,
      totalCustomers: customerCount || 0,
      netProfitThisMonth: Number(netProfit.toFixed(2))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Dashboard chart data points
export const getDashboardCharts = async (req, res) => {
  try {
    const today = new Date();
    
    // 1. Daily revenue for the current month
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const { data: monthOrders, error: mOrdErr } = await supabase
      .from('orders')
      .select('grand_total, created_at')
      .eq('workspace_id', req.workspace_id)
      .gte('created_at', startOfMonth.toISOString())
      .neq('status', 'cancelled');

    if (mOrdErr) throw mOrdErr;

    const dailyRevenue = {};
    // Populate all days of the month with 0 initially
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
      dailyRevenue[dateStr] = 0;
    }

    monthOrders.forEach(o => {
      const date = new Date(o.created_at);
      const dateStr = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
      if (dailyRevenue[dateStr] !== undefined) {
        dailyRevenue[dateStr] += Number(o.grand_total || 0);
      }
    });

    const dailyRevenueArray = Object.entries(dailyRevenue).map(([date, revenue]) => ({
      date: date.substring(8, 10), // just the day number
      revenue: Number(revenue.toFixed(2))
    }));

    // 2. Top 10 Best Selling Items this week
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - 7);
    const { data: orderItems, error: oiErr } = await supabase
      .from('order_items')
      .select('quantity, subtotal, menu_items(name)')
      .eq('workspace_id', req.workspace_id)
      .gte('created_at', startOfWeek.toISOString());

    if (oiErr) throw oiErr;

    const itemSales = {};
    orderItems.forEach(oi => {
      if (oi.menu_items) {
        const name = oi.menu_items.name;
        itemSales[name] = (itemSales[name] || 0) + Number(oi.quantity);
      }
    });

    const topItemsArray = Object.entries(itemSales)
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    // 3. Revenue by category
    const { data: catOrders, error: catErr } = await supabase
      .from('order_items')
      .select('quantity, subtotal, menu_items(category)')
      .eq('workspace_id', req.workspace_id)
      .gte('created_at', startOfMonth.toISOString());

    if (catErr) throw catErr;

    const categorySales = {
      espresso: 0,
      latte: 0,
      cappuccino: 0,
      mocha: 0,
      americano: 0,
      flat_white: 0,
      macchiato: 0,
      frappuccino: 0,
      cold_brew: 0,
      soda: 0,
      light_bites: 0
    };

    catOrders.forEach(co => {
      if (co.menu_items && categorySales[co.menu_items.category] !== undefined) {
        categorySales[co.menu_items.category] += Number(co.subtotal || 0);
      }
    });

    const categorySalesArray = Object.entries(categorySales).map(([category, value]) => ({
      name: category.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()),
      value: Number(value.toFixed(2))
    })).filter(c => c.value > 0);

    // 4. Expense breakdown
    const { data: expenses, error: expErr } = await supabase
      .from('expenses')
      .select('category, amount')
      .eq('workspace_id', req.workspace_id)
      .gte('created_at', startOfMonth.toISOString());

    if (expErr) throw expErr;

    const expenseBreakdown = {};
    expenses.forEach(e => {
      expenseBreakdown[e.category] = (expenseBreakdown[e.category] || 0) + Number(e.amount || 0);
    });

    const expensesArray = Object.entries(expenseBreakdown).map(([category, value]) => ({
      name: category.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()),
      value: Number(value.toFixed(2))
    }));

    res.json({
      dailyRevenue: dailyRevenueArray,
      topItems: topItemsArray,
      categorySales: categorySalesArray,
      expenseBreakdown: expensesArray
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Income & Profit Monthly Reports (Module 11)
export const getMonthlyReports = async (req, res) => {
  const { year } = req.query;
  const targetYear = Number(year || new Date().getFullYear());

  try {
    const startOfYear = new Date(targetYear, 0, 1).toISOString();
    const endOfYear = new Date(targetYear, 11, 31, 23, 59, 59, 999).toISOString();

    // 1. Fetch all orders in that year
    const { data: orders, error: ordErr } = await supabase
      .from('orders')
      .select('subtotal, discount_amount, gst_amount, grand_total, created_at')
      .eq('workspace_id', req.workspace_id)
      .gte('created_at', startOfYear)
      .lte('created_at', endOfYear)
      .neq('status', 'cancelled');

    if (ordErr) throw ordErr;

    // 2. Fetch all expenses in that year
    const { data: expenses, error: expErr } = await supabase
      .from('expenses')
      .select('amount, created_at')
      .eq('workspace_id', req.workspace_id)
      .gte('created_at', startOfYear)
      .lte('created_at', endOfYear);

    if (expErr) throw expErr;

    // Monthly aggregates
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const monthlyReport = months.map((month, index) => {
      // Filter items for this month
      const monthOrders = orders.filter(o => {
        const date = new Date(o.created_at);
        return date.getMonth() === index;
      });

      const monthExpenses = expenses.filter(e => {
        const date = new Date(e.created_at);
        return date.getMonth() === index;
      });

      const grossRevenue = monthOrders.reduce((sum, o) => sum + Number(o.subtotal || 0), 0);
      const discounts = monthOrders.reduce((sum, o) => sum + Number(o.discount_amount || 0), 0);
      const gstCollected = monthOrders.reduce((sum, o) => sum + Number(o.gst_amount || 0), 0);
      
      const netRevenue = grossRevenue + gstCollected - discounts; // subtotal + tax - discount
      const totalExpenses = monthExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
      
      const netProfit = netRevenue - totalExpenses;
      const profitMargin = netRevenue > 0 ? Number(((netProfit / netRevenue) * 100).toFixed(2)) : 0.0;

      return {
        month,
        monthIndex: index,
        grossRevenue: Number(grossRevenue.toFixed(2)),
        discounts: Number(discounts.toFixed(2)),
        gstCollected: Number(gstCollected.toFixed(2)),
        netRevenue: Number(netRevenue.toFixed(2)),
        totalExpenses: Number(totalExpenses.toFixed(2)),
        netProfit: Number(netProfit.toFixed(2)),
        profitMargin // %
      };
    });

    res.json(monthlyReport);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Daily breakdown within a month (Drill-down for Module 11)
export const getDailyReport = async (req, res) => {
  const { year, month } = req.query;
  const targetYear = Number(year || new Date().getFullYear());
  const targetMonth = Number(month || new Date().getMonth()); // 0-11

  try {
    const startOfMon = new Date(targetYear, targetMonth, 1).toISOString();
    const endOfMon = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999).toISOString();

    const { data: orders, error } = await supabase
      .from('orders')
      .select('grand_total, subtotal, discount_amount, gst_amount, created_at')
      .eq('workspace_id', req.workspace_id)
      .gte('created_at', startOfMon)
      .lte('created_at', endOfMon)
      .neq('status', 'cancelled');

    if (error) throw error;

    const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
    const dailyData = [];

    for (let d = 1; d <= daysInMonth; d++) {
      const dayOrders = orders.filter(o => new Date(o.created_at).getDate() === d);
      
      const gross = dayOrders.reduce((sum, o) => sum + Number(o.subtotal || 0), 0);
      const discount = dayOrders.reduce((sum, o) => sum + Number(o.discount_amount || 0), 0);
      const gst = dayOrders.reduce((sum, o) => sum + Number(o.gst_amount || 0), 0);
      const total = dayOrders.reduce((sum, o) => sum + Number(o.grand_total || 0), 0);

      dailyData.push({
        day: d,
        ordersCount: dayOrders.length,
        grossRevenue: Number(gross.toFixed(2)),
        discount: Number(discount.toFixed(2)),
        gstCollected: Number(gst.toFixed(2)),
        revenue: Number(total.toFixed(2))
      });
    }

    res.json(dailyData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

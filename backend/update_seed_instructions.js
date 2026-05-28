import fs from 'fs';
import path from 'path';

const detailedInstructions = {
  "Espresso": `1. **Grind the beans:** Use a burr grinder set to a fine grind — the texture should feel like fine table salt. Grind fresh immediately before pulling the shot; pre-ground coffee loses its flavour within minutes.
2. **Dose and distribute:** Add 18–20g of ground coffee into the portafilter basket. Tap the portafilter gently on the counter to settle the grounds evenly. Use your finger or a distribution tool to level the surface before tamping.
3. **Tamp:** Place the portafilter on a flat, stable surface. Using a tamper that fits your basket, apply firm and even downward pressure — approximately 15–20kg of force. The puck surface should be perfectly flat and level. Twist slightly at the end (a "polishing" motion) to smooth the surface. Wipe the rim of the portafilter clean with a dry cloth.
4. **Purge the machine:** Before locking in the portafilter, run the group head for 2–3 seconds to flush any old coffee residue and stabilise the temperature.
5. **Lock and extract:** Insert the portafilter into the group head, lock it firmly, and start extraction immediately. The machine should operate at 9 bar pressure and 92–94°C water temperature. The shot should begin as a slow, dark drip and build into a thin, steady stream.
6. **Timing and yield:** Total extraction time should be 25–30 seconds from the moment you start the pump. The final yield should be 30–40ml of espresso. You should see a thick, golden-brown crema forming on top — this is a sign of freshness and correct extraction.
7. **Troubleshoot:** If the shot runs too fast (under 20 seconds), grind finer or increase your dose. If it runs too slow (over 35 seconds) or chokes, grind coarser or reduce your tamp pressure.`,

  "Vanilla Espresso": `1. **Warm the cup:** Rinse your espresso cup with hot water to pre-warm it — this prevents the espresso from cooling too quickly on contact with a cold surface.
2. **Add syrup first:** Pour 10ml of vanilla syrup directly into the bottom of the warmed cup. Adding it before the espresso allows the heat of the shot to blend the two together naturally.
3. **Pull the espresso:** Extract a 30–40ml double or single espresso directly over the syrup, following the full espresso technique (see Recipe 1). The hot espresso will hit the syrup and begin to incorporate automatically.
4. **Stir and serve:** Give the drink a gentle stir with a small spoon — 2 to 3 slow circles — to ensure the syrup is fully blended. Serve immediately while hot and the crema is intact.`,

  "Caramel Espresso": `1. **Warm the cup:** Pre-warm a small espresso cup with hot water, then discard the water.
2. **Add caramel syrup:** Pour 10ml of caramel syrup into the bottom of the warm cup. Caramel syrup is slightly thicker than vanilla, so ensure it coats the base evenly.
3. **Pull the espresso:** Extract 30–40ml of espresso directly over the caramel using the standard espresso method (Recipe 1). The heat will partially dissolve and blend the syrup.
4. **Stir briefly:** Stir 2–3 times to combine. The caramel adds a rich, buttery sweetness to the espresso. Serve immediately — this drink is best enjoyed hot.
5. **Optional garnish:** For a premium presentation, add a small drizzle of caramel sauce (not just syrup) on top of the crema.`,

  "Cappuccino": `1. **Pull the double espresso:** Extract 60ml of espresso into a 180ml ceramic cup using the standard method. A double shot forms the strong coffee base the cappuccino needs.
2. **Prepare your milk:** Pour approximately 150ml of cold whole milk into a stainless steel steaming pitcher (this larger volume will yield the ~60ml steamed + ~60ml foam you need). Cold milk from the fridge froths best.
3. **Position the steam wand:** Submerge the steam wand tip just below the milk surface. Tilt the pitcher at a slight angle to encourage a circular whirlpool motion.
4. **Steam in two phases:**
   - *Stretching phase (aeration):* Keep the tip at the surface level for 3–5 seconds, allowing air to be incorporated. You should hear a hissing or tearing paper sound. Stop when the milk volume has increased by about one-third.
   - *Heating phase:* Lower the tip deeper into the milk to heat without adding more air. Continue until the milk reaches 62–65°C (warm but not burning to the touch on the outside of the pitcher).
5. **Rest and split the milk:** Tap the pitcher firmly on the counter 2–3 times to burst large bubbles, then swirl it to integrate the foam with the liquid milk. For cappuccino, you want a 1:1:1 ratio — the foam should be thick and stiff enough to hold its shape on a spoon.
6. **Assemble:** Pour the steamed liquid milk over the espresso first, then use a spoon to hold back the foam and add it on top as a thick layer.
7. **Finish:** Lightly dust the foam with cocoa powder using a small sieve for a classic presentation.`,

  "Vanilla Cappuccino": `1. **Pull the double espresso** into a 180ml cup (see Recipe 1 for full technique).
2. **Stir in vanilla syrup:** Add 10ml of vanilla syrup directly to the hot espresso and stir well to dissolve completely. Mixing it with the espresso (not the milk) ensures even distribution of flavour.
3. **Steam the milk:** Prepare 60ml steamed milk and 60ml stiff foam using the two-phase steaming method described in Recipe 4. Whole milk creates the richest, sweetest foam.
4. **Pour:** Pour the steamed liquid milk into the espresso-syrup blend. Then spoon the stiff foam generously on top.
5. **Finish:** Dust with cocoa powder through a fine sieve. Serve immediately.`,

  "Caramel Cappuccino": `1. **Pull the double espresso** into a 180ml cup.
2. **Stir in caramel syrup:** Mix 10ml of caramel syrup into the hot espresso until fully combined. The warm espresso helps dissolve the syrup completely.
3. **Steam the milk:** Using the two-phase technique (Recipe 4), steam whole milk to 62–65°C with a stiff, glossy foam.
4. **Assemble:** Pour steamed milk over the caramel-espresso mixture. Spoon the thick foam on top.
5. **Drizzle:** Finish with a generous drizzle of caramel sauce (the thicker drizzling type, not the thin syrup) over the foam in a zigzag or spiral pattern. Serve at once.`,

  "Latte": `1. **Prepare a 240ml cup:** A latte is a longer drink, so use a larger cup or glass. Pre-warm it with hot water.
2. **Pull the double espresso:** Extract 60ml of espresso into the cup as the base.
3. **Steam the milk for microfoam:** Pour 220–240ml of cold whole milk into a steaming pitcher. The goal for a latte is microfoam — velvety, glossy milk with tiny, invisible bubbles (not the thick, stiff foam of a cappuccino).
   - Aerate for only 2–3 seconds, adding just a small amount of air.
   - Then heat the milk to 62–65°C with the wand deeper, creating a smooth, paint-like texture.
4. **Tap and swirl:** Tap the pitcher firmly to eliminate any visible bubbles. Swirl vigorously until the milk looks glossy and flows like cream.
5. **Pour from low height:** Hold the pitcher close to the cup surface (1–2cm above) and pour slowly. The weight of the milk will push through the espresso crema, and the microfoam will naturally rise to the top, creating a thin 1cm foam layer.
6. **Optional latte art:** For a simple heart, pour steadily until the cup is ¾ full, then push the pitcher forward while lifting slightly to create a white dot, and quickly draw the spout back through the centre.`,

  "Vanilla Latte": `1. **Add vanilla syrup to the cup first:** Pour 15ml of vanilla syrup into the bottom of a pre-warmed 240ml cup.
2. **Pull espresso:** Extract 60ml of double espresso directly over the syrup. Stir gently — the hot espresso will blend the syrup.
3. **Steam the milk:** Create smooth, silky microfoam using 220ml of cold whole milk (see latte technique in Recipe 7). Steam to 62–65°C.
4. **Pour:** Pour the steamed milk slowly from a low height into the espresso-syrup mix. The microfoam will float to the top naturally, leaving a 1cm layer.
5. **Serve:** The vanilla adds a warm, sweet note that complements the espresso without overpowering it. Serve immediately.`,

  "Caramel Latte": `1. **Add caramel syrup:** Pour 15ml of caramel syrup into a pre-warmed 240ml cup.
2. **Pull espresso:** Extract 60ml over the syrup and stir briefly to combine.
3. **Steam the milk:** Prepare silky microfoam at 62–65°C (Recipe 7 technique).
4. **Pour:** Pour steamed milk over the espresso slowly, allowing the microfoam to settle on top.
5. **Drizzle caramel:** Using a squeeze bottle of caramel sauce, drizzle a spiral or zigzag pattern on the foam surface. This adds both flavour and a visual finish. Serve immediately.`,

  "Hazelnut Latte": `1. **Add hazelnut syrup:** Pour 15ml of hazelnut syrup into a pre-warmed 240ml cup.
2. **Pull espresso:** Extract 60ml over the syrup. Stir 2–3 times to combine; hazelnut syrup blends easily with hot espresso.
3. **Steam the milk:** Prepare silky microfoam at 62–65°C using the latte technique (Recipe 7).
4. **Pour:** Pour steamed milk slowly from low height over the espresso blend. Microfoam will form a thin layer on top.
5. **Serve immediately:** Hazelnut flavour fades quickly, so this drink is best enjoyed fresh and hot.`,

  "Lavender Latte": `1. **Add lavender syrup to the cup:** Pour 15ml of lavender syrup (ideally house-made with culinary-grade dried lavender, see Recipe 87) into a pre-warmed cup.
2. **Pull espresso:** Extract 60ml of double espresso directly over the syrup. Stir briefly — the floral note of lavender pairs beautifully with the bitterness of espresso.
3. **Steam the milk:** Use 220ml of cold whole milk or oat milk (oat milk enhances the floral notes). Steam to 62–65°C with silky microfoam.
4. **Pour:** Pour steamed milk slowly from low height, allowing microfoam to float on top.
5. **Garnish (optional):** Place 3–4 dried culinary lavender buds on top of the foam for a beautiful, aromatic presentation. Do not use perfume-grade lavender.`,

  "Rose Latte": `1. **Add rose syrup:** Pour 15ml of rose syrup (from Recipe 87 or a good quality commercial rose syrup) into a pre-warmed cup. The syrup should have a gentle, natural rose scent — not overpowering.
2. **Pull espresso:** Extract 60ml over the rose syrup. Stir gently — the syrup will tint the espresso with a faint pink hue.
3. **Steam the milk:** Prepare velvety microfoam with 220ml of whole milk at 62–65°C. The richness of whole milk balances the delicate floral flavour.
4. **Pour:** Pour the steamed milk slowly from a low height to preserve the microfoam layer.
5. **Garnish (optional):** Float a single dried or food-safe rose petal on the foam for an elegant finish. Serve at once.`,

  "Mocha": `1. **Prepare the chocolate base:** Add 20ml of chocolate sauce (or dissolve 2 tsp of cocoa powder in 10ml of hot water to make a paste) into the bottom of a pre-warmed 240ml cup.
2. **Pull espresso:** Extract 60ml of double espresso directly over the chocolate. Immediately stir vigorously — you want the chocolate fully dissolved and blended with the espresso before adding milk.
3. **Steam the milk:** Steam 180ml of whole milk to 62–65°C with a light microfoam (slightly more than a latte, but not as stiff as a cappuccino).
4. **Pour the milk:** Add the steamed milk slowly into the chocolate-espresso base. The milk will lighten the colour and soften the bitterness of the espresso.
5. **Top with whipped cream:** Pipe or spoon whipped cream generously on top.
6. **Garnish:** Drizzle chocolate sauce in a spiral over the whipped cream. Optionally dust with cocoa powder or chocolate shavings.`,

  "White Mocha": `1. **Combine white chocolate and espresso:** Add 20ml of white chocolate sauce to a pre-warmed cup. Pull 60ml of double espresso directly over it. Stir well — white chocolate sauce is thick and requires thorough mixing to prevent it from sinking to the bottom.
2. **Steam the milk:** Prepare 180ml of whole milk as light microfoam at 62–65°C. Whole milk is essential here as it complements the richness of the white chocolate.
3. **Pour:** Pour steamed milk into the mocha base, allowing the foam to settle on top.
4. **Whipped cream:** Pipe a swirl of whipped cream on top. White mocha is a sweeter, creamier drink, so the whipped cream adds to the indulgent profile.
5. **Optional finish:** Add a light dusting of vanilla powder or white chocolate shavings for garnish.`,

  "Caramel Mocha": `1. **Build the flavour base:** Add 15ml of chocolate sauce and 10ml of caramel syrup to the bottom of a pre-warmed 240ml cup.
2. **Pull espresso:** Extract 60ml of double espresso over the sauces. Stir thoroughly until the chocolate and caramel are fully dissolved into the espresso — this step is critical for a smooth, even flavour throughout the drink.
3. **Steam the milk:** Prepare 180ml of whole milk as light microfoam at 62–65°C.
4. **Pour:** Add steamed milk slowly to the espresso-chocolate-caramel blend.
5. **Top and garnish:** Pipe whipped cream on top. Drizzle caramel sauce generously over the whipped cream in a zigzag pattern. For extra visual appeal, add a small drizzle of chocolate sauce too.`,

  "Hazelnut Mocha": `1. **Combine chocolate and hazelnut:** Add 15ml of chocolate sauce and 10ml of hazelnut syrup to the bottom of a pre-warmed cup.
2. **Pull espresso:** Extract 60ml over the sauces. Stir well until fully blended — the combination of hazelnut and chocolate creates a Nutella-like profile.
3. **Steam the milk:** Steam 180ml of whole milk to 62–65°C with light microfoam.
4. **Pour:** Add steamed milk slowly into the espresso blend.
5. **Garnish:** Top with whipped cream, a drizzle of chocolate sauce, and a drizzle of hazelnut syrup. Optionally scatter a few crushed toasted hazelnuts over the whipped cream for texture.`,

  "Americano": `1. **Pull the double espresso:** Extract 60ml of espresso using the standard method (Recipe 1). Pull the shot into the cup you'll serve it in — typically a 200–250ml cup.
2. **Heat the water:** Use filtered water heated to 85–90°C (not boiling — boiling water scorches the espresso and creates bitterness). Many espresso machines have a hot water tap; use this if available.
3. **Add water over espresso:** Pour 120–150ml of hot water slowly over the espresso shot, not the other way around. Pouring water over espresso preserves the crema on top — reversing the order would destroy it.
4. **Adjust to taste:** Some customers prefer a shorter (stronger) americano with 100ml water, others prefer a longer one at 180ml. Offer to adjust.
5. **Serve immediately:** An Americano loses its crema and cools quickly. It is best served right away.`,

  "Vanilla Americano": `1. **Add vanilla syrup to cup:** Pour 10ml of vanilla syrup into the bottom of a pre-warmed 200–250ml cup.
2. **Pull espresso:** Extract 60ml of double espresso directly over the syrup. Stir gently to blend.
3. **Add hot water:** Pour 120–150ml of hot water (85–90°C) over the espresso, again preserving the crema by adding water last. The vanilla will perfume the entire drink.
4. **Serve immediately.**`,

  "Caramel Americano": `1. **Add caramel syrup to cup:** Pour 10ml of caramel syrup into a pre-warmed cup.
2. **Pull espresso:** Extract 60ml of double espresso over the syrup. Stir to combine — caramel syrup is slightly viscous, so mix well before adding water.
3. **Add hot water:** Pour 120–150ml of hot water (85–90°C) into the cup over the espresso.
4. **Stir and serve:** Give a final gentle stir and serve immediately. The caramel adds warmth and sweetness without masking the espresso character.`,

  "Flat White": `1. **Pull a ristretto:** A ristretto uses the same dose of coffee (18–20g) as a regular espresso but only 30ml of water per shot (60ml for a double). Stop extraction at 18–22 seconds. The result is a sweeter, more concentrated, less bitter shot.
2. **Choose a smaller cup:** Use a 160ml flat white cup or tulip cup. The smaller format ensures the coffee-to-milk ratio stays strong and coffee-forward.
3. **Steam for silky microfoam:** Pour 150ml of cold whole milk into a small steaming pitcher. Aerate very briefly — just 1–2 seconds — to add minimal air. Then heat to 60–62°C. The milk should be very smooth, glossy, and almost paint-like in consistency. It should have no visible bubbles.
4. **Tap and swirl:** Tap the pitcher hard and swirl well to integrate the tiny amount of foam. The milk should look like liquid silk.
5. **Pour from very low height:** Hold the pitcher almost touching the cup surface. Pour in a slow, steady stream. The flat white should have just a very thin (less than 5mm) layer of microfoam on top — much less than a latte. This is what distinguishes it.`,

  "Vanilla Flat White": `1. **Add vanilla syrup:** Pour 8–10ml of vanilla syrup into a pre-warmed 160ml flat white cup.
2. **Pull ristretto:** Extract the double ristretto (see Recipe 20 for technique) directly over the syrup. Stir briefly.
3. **Steam the milk:** Steam 150ml of whole milk to 60–62°C with very silky, minimal-foam microfoam.
4. **Pour:** Pour from a very low height into the cup. The final drink should be coffee-forward with a gentle vanilla sweetness. Serve immediately.`,

  "Toffee Flat White": `1. **Add toffee syrup:** Pour 8–10ml of toffee or brown sugar syrup into a pre-warmed flat white cup.
2. **Pull ristretto:** Extract 60ml ristretto (Recipe 20) directly over the syrup. Stir gently to combine the thick, warm toffee notes with the espresso.
3. **Steam the milk:** Prepare very silky microfoam with 150ml of whole milk at 60–62°C — minimal aeration, maximum smoothness.
4. **Pour:** Pour from a very low height. The toffee-caramel flavour pairs exceptionally well with the concentrated sweetness of a ristretto.`,

  "Macchiato": `1. **Prepare a small espresso cup:** Use a 60–90ml espresso demitasse cup. Pre-warm it.
2. **Pull the espresso:** Extract a single (30ml) or double (60ml) espresso into the cup using the standard technique (Recipe 1).
3. **Make stiff foam:** Steam a small amount of milk (80ml) to create very stiff, dry foam — aerate for longer than usual (5–7 seconds). The foam should hold peaks like whipped cream. You can also steam and separate the foam using a spoon.
4. **Mark the espresso:** Place 1–2 large tablespoons of stiff foam in the centre of the espresso. The word "macchiato" means "stained" in Italian — the foam "stains" or marks the espresso. It should sit on top as a distinct dollop, not blend in.`,

  "Caramel Macchiato": `1. **Add vanilla syrup to cup:** Pour 15ml of vanilla syrup into the bottom of a 240ml glass or cup.
2. **Pour steamed milk:** Steam 180ml of whole milk to 62–65°C with a silky microfoam. Pour the steamed milk slowly into the glass, holding back the foam. You want mostly milk at this stage. The vanilla syrup will swirl up through the milk.
3. **Layer the espresso on top:** Pull a 60ml double espresso. Using the back of a large spoon held just above the milk surface, slowly pour the espresso over the spoon so it flows gently onto the milk without mixing — this creates the characteristic layered look, with espresso sitting on top of the milk.
4. **Drizzle caramel:** Using a squeeze bottle, drizzle caramel sauce in a crosshatch or spiral pattern directly over the espresso layer on top. This is the finishing signature.
5. **Serve without stirring** — the layers are the visual presentation. The customer stirs it themselves.`,

  "Hazelnut Macchiato": `1. **Add hazelnut syrup to the cup:** Pour 15ml of hazelnut syrup into the bottom of a 240ml glass.
2. **Add steamed milk:** Steam 180ml of whole milk to 62–65°C, creating smooth microfoam. Pour the milk into the glass, allowing the hazelnut syrup to blend upward.
3. **Layer the espresso:** Pull 60ml of double espresso. Using the back of a spoon, gently pour the espresso over the milk surface so it floats on top and creates a layered effect. The hazelnut aroma will rise through the drink beautifully.
4. **Serve as is** — the layered presentation is part of the experience.`,

  "Vietnamese Iced Cold Coffee": `1. **Set up the phin filter:** Place a Vietnamese phin (metal drip filter) on top of a small glass or cup. Ensure the inner press filter is at hand.
2. **Add ground coffee:** Use a coarse grind — slightly finer than French press, but not as fine as espresso. Add 20g of dark roast coffee into the phin basket and shake it gently to level the grounds.
3. **Bloom the coffee:** Pour just 10ml of 95°C hot water (just off the boil) over the grounds. Wait 30 seconds for the coffee to bloom (expand), which releases CO₂ and improves extraction.
4. **Add the press and water:** Place the inner press plate on top of the grounds and press it down gently. Pour the remaining 70ml of hot water slowly over the press. Place the lid on top to retain heat.
5. **Drip for 4–5 minutes:** The coffee will drip slowly through the filter — this is normal. Do not rush it. If it drips too fast, the grind is too coarse; too slow means too fine.
6. **Prepare the serving glass:** Add 30ml of sweetened condensed milk to a tall glass. The condensed milk should sit at the bottom.
7. **Combine:** Once the coffee has fully dripped, remove the phin. Pour the hot coffee over the condensed milk and stir well until fully combined.
8. **Ice:** Fill another tall glass with ice cubes. Pour the hot coffee-condensed milk mixture over the ice. Serve with a long spoon and straw.`,

  "Vietnamese Iced Coffee (Vanilla Version)": `1. **Brew coffee using a phin filter:** Follow Steps 1–5 from Recipe 26 to brew the dark roast coffee using the phin filter method.
2. **Prepare the glass:** Add 20ml of vanilla syrup to the bottom of a tall glass.
3. **Pour coffee over syrup:** Once brewed, pour the hot coffee over the vanilla syrup and stir well to combine.
4. **Pour over ice:** Fill a separate tall glass with ice cubes, then pour the coffee-vanilla blend over the ice. Alternatively, pour directly into the same glass if it is heat-safe.
5. **Serve with a straw:** This version is lighter and less sweet than the condensed milk original, with a delicate floral vanilla note.`,

  "Cold Brew Float": `1. **Make cold brew in advance (12–16 hours ahead):** Combine 1 part coarse-ground coffee with 5 parts cold filtered water in a jar or container (e.g., 100g coffee to 500ml water). Stir to ensure all grounds are saturated. Cover and refrigerate for 12–16 hours. Strain through a fine mesh sieve lined with a paper filter or cheesecloth. Store concentrate in a sealed jar for up to 2 weeks.
2. **Dilute before serving:** Cold brew concentrate is very strong; dilute 1:1 with cold water or cold milk before using (120ml concentrate + 120ml water = 240ml ready-to-drink cold brew).
3. **Fill glass with ice:** Add a generous handful of ice to a tall glass. If using simple syrup, add 10ml now and stir briefly.
4. **Pour cold brew:** Pour 120ml of diluted cold brew concentrate over the ice.
5. **Add ice cream:** Using an ice cream scoop, gently place 2 scoops of vanilla ice cream on top of the cold brew. The scoops should float slightly.
6. **Serve immediately:** Provide a long spoon and a thick straw — as the ice cream melts, it blends with the cold brew to create a creamy, rich drink.`,

  "Caramel Cold Brew Float": `1. **Prepare cold brew:** Use pre-made cold brew concentrate diluted 1:1 (see Recipe 28 for full method).
2. **Drizzle caramel inside the glass:** Before adding ice, drizzle a spiral of caramel sauce around the inside walls of the glass for a visually striking presentation.
3. **Add ice and cold brew:** Fill the glass with ice cubes, then pour 120ml of cold brew over them.
4. **Add ice cream:** Scoop 2 balls of vanilla ice cream gently on top of the cold brew.
5. **Drizzle caramel over ice cream:** Finish with a generous drizzle of caramel sauce over the scoops. Serve immediately with a spoon and straw.`,

  "Chocolate Cold Brew Float": `1. **Prepare cold brew:** Use pre-made and diluted cold brew (Recipe 28 technique).
2. **Drizzle chocolate inside the glass:** Swirl chocolate sauce around the inside of a tall glass for visual appeal.
3. **Add ice and pour cold brew:** Fill with ice cubes, then pour the cold brew over them.
4. **Add chocolate ice cream:** Gently place 2 scoops of chocolate ice cream on top.
5. **Finish with chocolate drizzle:** Drizzle chocolate sauce over the scoops. The double chocolate (ice cream + sauce) makes this intensely rich. Serve at once with a long spoon and straw.`,

  "Iced Latte": `1. **Pull the espresso:** Extract a standard 60ml double shot. Allow it to cool for 1–2 minutes, or pull it into a separate small cup and let it sit briefly. Pouring scalding-hot espresso directly onto ice can cause the ice to melt too quickly and the drink to become watery.
2. **Fill the glass with ice:** Use a tall 350–400ml glass. Fill it to the top with ice cubes — not crushed ice, as it melts faster and dilutes the drink.
3. **Add cold milk first:** Pour 150ml of cold whole milk over the ice. Milk first helps cool the subsequent espresso and prevents it from melting the ice on impact.
4. **Pour espresso on top:** Slowly pour the slightly cooled espresso over the milk and ice. This creates a beautiful layered effect before stirring.
5. **Stir gently:** Give 2–3 slow stirs with a long spoon to blend the espresso and milk. Serve immediately.`,

  "Vanilla Iced Latte": `1. **Stir vanilla syrup into the cold milk:** Combine 15ml of vanilla syrup with 150ml of cold whole milk in a small jug or directly in the glass. Stir well — this ensures the syrup is evenly distributed and doesn't sink to the bottom.
2. **Fill glass with ice:** Pack the glass with ice cubes.
3. **Pour the vanilla milk over ice:** Pour the syrup-milk blend over the ice.
4. **Pull and add espresso:** Extract 60ml of double espresso. Let it cool slightly, then pour over the milk and ice. The espresso will create a dark layer on top before blending.
5. **Serve with a straw** for stirring.`,

  "Caramel Iced Latte": `1. **Combine caramel syrup and milk:** Stir 15ml of caramel syrup into 150ml of cold milk until fully blended.
2. **Drizzle caramel inside the glass:** Before adding ice, drizzle a ring of caramel sauce around the inside of the glass — this adds a sweet visual detail.
3. **Fill with ice:** Pack the glass with ice cubes.
4. **Pour caramel milk:** Add the caramel milk over the ice.
5. **Add espresso:** Pull 60ml of double espresso, cool slightly, and pour over the top.
6. **Finish:** Drizzle more caramel sauce over the espresso layer on top. Serve with a long straw.`,

  "Hazelnut Iced Latte": `1. **Mix hazelnut syrup into the milk:** Stir 15ml of hazelnut syrup into 150ml of cold whole milk. Mix well.
2. **Fill glass with ice** and pour the hazelnut milk over the cubes.
3. **Pull and add espresso:** Extract 60ml of double espresso, allow to cool slightly, then pour over the top.
4. **Serve immediately.** Optionally garnish with a sprinkle of crushed toasted hazelnuts or a small hazelnut drizzle on top.`,

  "Brown Sugar Iced Latte": `1. **Prepare brown sugar milk:** Stir 15ml of brown sugar syrup (see Recipe 87 for house-made version) into 150ml of cold milk. The warm molasses notes of brown sugar complement espresso beautifully.
2. **Fill glass with ice:** Use a tall glass packed with ice cubes.
3. **Pour brown sugar milk:** Add the prepared milk over the ice.
4. **Add espresso:** Pull 60ml of double espresso, cool briefly, and pour over the milk.
5. **Dust with cinnamon:** Lightly dust the top with ground cinnamon using a fine sieve or shaker. This adds warmth and spice to the brown sugar-espresso pairing.`,

  "Lavender Iced Latte": `1. **Prepare lavender milk:** Stir 15ml of lavender syrup into 150ml of cold oat milk (oat milk enhances the floral character) or whole milk. Mix well until combined.
2. **Fill glass with ice** — use large, clear ice cubes if available as lavender lattes are visually striking drinks.
3. **Pour lavender milk:** Pour the prepared milk over the ice.
4. **Add espresso:** Pull 60ml of double espresso, cool slightly, and pour slowly over the back of a spoon for a beautiful layered effect.
5. **Garnish:** Optionally add 2–3 dried culinary lavender buds on top for aroma and presentation.`,

  "Pistachio Iced Latte": `1. **Mix pistachio syrup into milk:** Stir 15ml of pistachio syrup into 150ml of cold whole milk. Pistachio syrups vary — use a high-quality one with a real nutty green note, not an artificial one.
2. **Fill glass with ice** and pour the pistachio milk over the cubes.
3. **Pull and add espresso:** Extract 60ml of double espresso, allow to cool slightly, then pour over the top.
4. **Garnish:** Sprinkle a small amount of finely crushed pistachios over the espresso layer on top. This adds crunch, colour, and authentic pistachio flavour.`,

  "Iced Cappuccino": `1. **Make cold foam:** Pour 120ml of cold whole milk into a sealed jar. Shake vigorously for 45–60 seconds until the milk doubles in volume and becomes thick and foamy. Alternatively, use a handheld cold frother — froth cold milk for 30 seconds without applying heat. The result should be cool, thick foam with medium bubbles.
2. **Pull espresso:** Extract 60ml of double espresso and let it cool for 1–2 minutes.
3. **Fill glass with ice:** Pack a tall glass with ice cubes.
4. **Add cold milk:** Pour 80ml of plain cold milk over the ice.
5. **Add espresso:** Pour the cooled espresso over the milk.
6. **Spoon cold foam on top:** Generously layer the cold foam over the drink using a large spoon. The foam should sit proud on top of the glass and not sink. Serve immediately.`,

  "Vanilla Iced Cappuccino": `1. **Make cold foam:** Shake or cold-froth 120ml of whole milk until thick and foamy (see Recipe 38 technique).
2. **Mix vanilla syrup into the espresso:** Pull 60ml of double espresso. Add 10ml of vanilla syrup and stir to combine. Cool slightly.
3. **Fill glass with ice**, add 80ml of cold milk.
4. **Pour vanilla espresso:** Pour the cooled vanilla espresso over the iced milk.
5. **Top with cold foam:** Spoon a generous layer of cold foam on top. Serve immediately.`,

  "Caramel Iced Cappuccino": `1. **Make cold foam:** Shake or cold-froth 120ml of whole milk.
2. **Prepare the caramel espresso:** Pull 60ml of double espresso. Add 10ml of caramel syrup and stir well. Allow to cool briefly.
3. **Build the drink:** Fill glass with ice, pour 80ml of cold milk, then add the caramel espresso on top.
4. **Add cold foam:** Spoon a thick layer of cold foam on top.
5. **Drizzle caramel:** Using a squeeze bottle, drizzle caramel sauce over the foam in a decorative spiral or zigzag.`,

  "Iced Mocha": `1. **Make the chocolate espresso base:** Pull 60ml of double espresso into a small cup. Add 20ml of chocolate sauce. Stir vigorously and thoroughly until the chocolate is fully dissolved into the espresso — no lumps. Allow to cool for 2 minutes.
2. **Fill glass with ice:** Pack a tall glass with ice cubes.
3. **Add cold milk:** Pour 150ml of cold whole milk over the ice.
4. **Add chocolate espresso:** Pour the cooled chocolate-espresso blend over the milk and ice. It will layer beautifully before stirring.
5. **Top with whipped cream:** Pipe or spoon whipped cream over the top.
6. **Drizzle chocolate:** Drizzle additional chocolate sauce over the whipped cream. Serve with a straw and a long spoon.`,

  "Hazelnut Iced Mocha (Nutella Style)": `1. **Build the base:** Pull 60ml of espresso. Add 15ml of chocolate sauce and 10ml of hazelnut syrup directly to the espresso. Stir well until smooth — this creates a flavour reminiscent of Nutella.
2. **Cool slightly** — 1–2 minutes at room temperature.
3. **Build the drink:** Pack a tall glass with ice. Pour 150ml of cold milk over the ice. Add the hazelnut-chocolate espresso blend on top.
4. **Top with whipped cream.** Optionally drizzle hazelnut syrup or chocolate sauce over the top.`,

  "Caramel Turtle Iced Mocha": `1. **Build the flavour base:** Pull 60ml of espresso. Add 15ml of chocolate sauce and 10ml of caramel syrup. Stir thoroughly until completely smooth.
2. **Drizzle caramel inside the glass:** Swirl caramel sauce around the inside walls of a tall glass before adding ice.
3. **Build the drink:** Fill glass with ice, pour cold milk, then the chocolate-caramel espresso over the top.
4. **Top and garnish:** Add a generous swirl of whipped cream. Drizzle caramel sauce over the top. For extra presentation, add a drizzle of chocolate sauce too.`,

  "Iced Americano": `1. **Fill glass with ice and cold water:** Add ice cubes to a tall glass, then pour 120ml of cold (room temperature or chilled) filtered water over them. Adding water first means the espresso layers on top.
2. **Pull the espresso:** Extract 60ml of double espresso using the standard method (Recipe 1).
3. **Pour espresso over the top:** Slowly pour the hot espresso over the cold water and ice. The temperature contrast will create a layered effect, with the dark espresso floating on top of the lighter water. This is visually striking and allows the customer to enjoy the aroma before mixing.
4. **Serve without stirring** — let the customer stir it themselves to enjoy both the layered visual and the gradual blending of flavours.`,

  "Vanilla Iced Americano": `1. **Add vanilla syrup to the cold water:** Stir 10ml of vanilla syrup into 120ml of cold water until dissolved.
2. **Fill glass with ice:** Pack a tall glass with ice cubes.
3. **Pour vanilla water:** Add the vanilla water over the ice.
4. **Pour espresso on top:** Pull 60ml of espresso and slowly pour it over the vanilla water and ice, creating a layered look.
5. **Serve immediately.**`,

  "Iced Macchiato": `1. **Add vanilla syrup:** Pour 15ml of vanilla syrup to the bottom of a tall, clear glass — the glass is important for displaying the layers.
2. **Fill with ice:** Pack the glass with ice cubes to the top.
3. **Pour cold milk:** Add 150ml of cold whole milk over the ice. The vanilla syrup will begin to swirl up through the milk.
4. **Layer the espresso:** Pull 60ml of double espresso. Hold a large spoon just above the milk surface and slowly pour the espresso over the back of the spoon. This gentle action ensures the espresso floats on top of the milk, creating a distinct dark-on-light layered effect.
5. **Serve without stirring** — the layers are the visual signature of this drink.`,

  "Caramel Iced Macchiato": `1. **Add vanilla syrup:** Pour 15ml of vanilla syrup to the bottom of a tall clear glass.
2. **Add ice and milk:** Fill the glass with ice, then pour 150ml of cold milk over the ice.
3. **Layer the espresso:** Using the back-of-spoon technique (Recipe 46), slowly pour 60ml of espresso over the milk so it sits as a layer on top.
4. **Drizzle caramel:** Using a squeeze bottle, drizzle caramel sauce in a grid or spiral pattern directly on top of the espresso layer. This is the defining visual element of a caramel iced macchiato.
5. **Serve without stirring** for the full layered presentation.`,

  "Affogato": `1. **Chill the serving dish:** Use a small chilled ceramic bowl, glass, or wide dessert cup. Chill it in the freezer for 2–3 minutes before serving to keep the ice cream cold longer.
2. **Scoop the ice cream:** Add 2 generous scoops of high-quality vanilla ice cream (gelato works exceptionally well) into the chilled dish.
3. **Pull a fresh espresso:** Extract a 30–60ml single or double espresso immediately before serving — the espresso must be hot and freshly made. This timing is important; the contrast of scalding espresso meeting frozen ice cream is the entire experience.
4. **Pour immediately:** Pour the hot espresso directly over the ice cream scoops. The ice cream will begin to melt around the edges instantly.
5. **Serve at once:** Bring to the customer immediately. Provide a spoon — the traditional way to enjoy an affogato is to eat it as it melts, alternating between spoonfuls of cold ice cream and sips of coffee.`,

  "Caramel Affogato": `1. **Prepare the dish:** Chill a small bowl or cup in the freezer for a few minutes.
2. **Scoop ice cream:** Place 2 scoops of vanilla ice cream or salted caramel gelato into the chilled dish.
3. **Add caramel to espresso:** Pull a hot 30–60ml espresso. Stir 5ml of caramel syrup directly into the hot espresso — the heat dissolves it instantly.
4. **Pour over ice cream:** Pour the caramel espresso over the scoops immediately.
5. **Optional finish:** Add a light drizzle of caramel sauce directly over the ice cream before pouring the espresso, for a layered caramel effect.`,

  "Mocha Affogato": `1. **Chill the dish** in the freezer for a few minutes.
2. **Scoop chocolate ice cream:** Use 2 scoops of rich chocolate ice cream or dark chocolate gelato.
3. **Drizzle chocolate sauce:** Before adding the espresso, drizzle chocolate sauce over the scoops for a deeper chocolate flavour.
4. **Pull fresh espresso:** Extract 30–60ml of hot espresso immediately before serving.
5. **Pour and serve at once:** Pour the espresso directly over the chocolate ice cream. Serve immediately as the contrast of hot and cold is the centrepiece of this dessert-drink.`,

  "Coffee Frappuccino": `1. **Brew and cool the espresso:** Pull 60ml of double espresso and allow it to cool to room temperature (or chill in the fridge for 5 minutes). Using hot espresso in a blender can cause steam to build up and result in a watery frappuccino.
2. **Load the blender:** Add the cooled espresso, 150ml of whole milk, 20ml of simple syrup, and a full cup of ice cubes to a high-powered blender.
3. **Blend on high:** Blend on the highest setting for 30–45 seconds until the mixture is completely smooth, thick, and frothy with no ice chunks remaining. The texture should be like a thick shake.
4. **Taste and adjust:** If too thick, add a splash of cold milk. If too thin, add a few more ice cubes and blend again.
5. **Pour into cup:** Pour into a tall 400ml cup.
6. **Whipped cream:** Pipe a generous swirl of whipped cream on top. Serve immediately with a wide straw.`,

  "Vanilla Frappuccino": `1. **Cool the espresso** to room temperature.
2. **Blend:** Combine the cooled espresso, milk, vanilla syrup, and ice in a blender. Blend on high for 30–45 seconds until completely smooth.
3. **Pour into a tall cup.** Top with a swirl of whipped cream.
4. **Finish:** Drizzle a small amount of vanilla syrup over the whipped cream for extra flavour and presentation.`,

  "Hazelnut Frappuccino": `1. **Cool the espresso.** Combine espresso, milk, hazelnut syrup, and ice in a blender.
2. **Blend on high for 30–45 seconds** until smooth and thick.
3. **Pour into a tall cup** and top with whipped cream.
4. **Drizzle:** Add a drizzle of hazelnut syrup or chocolate sauce over the whipped cream. Optionally sprinkle a few finely chopped toasted hazelnuts for crunch and authenticity.`,

  "Brown Sugar Frappuccino": `1. **Cool the espresso.** Add it to a blender along with the milk, brown sugar syrup, a pinch of cinnamon, and ice.
2. **Blend on high for 30–45 seconds** until smooth and thick.
3. **Pour into cup.** Top with whipped cream.
4. **Finish:** Dust the whipped cream with ground cinnamon using a fine sieve or shaker. The cinnamon-brown sugar combination is warming and aromatic.`,

  "Toffee Frappuccino": `1. **Cool the espresso.** Add it with milk, toffee syrup, and ice to the blender.
2. **Blend on high for 30–45 seconds** until smooth and thick.
3. **Pour into a tall cup.** Top with whipped cream.
4. **Finish:** Drizzle toffee syrup over the whipped cream.`
};

console.log("Starting programmatic recipe instructions update inside seed_all_recipes.js...");

const seedFilePath = path.join(process.cwd(), 'seed_all_recipes.js');
let content = fs.readFileSync(seedFilePath, 'utf8');

let updated = 0;

for (const [name, instructions] of Object.entries(detailedInstructions)) {
  const escapedInstructions = instructions
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n');

  const escapedName = name.replace(/[-/\\^$*+?.()|[\\]{}]/g, '\\$&');
  const regex = new RegExp(`(name:\\s*'${escapedName}',[^}]*?instructions:\\s*')([^']*?')`, 's');
  
  if (regex.test(content)) {
    content = content.replace(regex, `$1${escapedInstructions}'`);
    updated++;
  } else {
    const regexDouble = new RegExp(`(name:\\s*"${escapedName}",[^}]*?instructions:\\s*")([^"]*?")`, 's');
    if (regexDouble.test(content)) {
      const escapedInstructionsDouble = instructions
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n');
      content = content.replace(regexDouble, `$1${escapedInstructionsDouble}"`);
      updated++;
    } else {
      console.warn(`⚠️ Warning: Could not locate menu item "${name}" for instructions update.`);
    }
  }
}

fs.writeFileSync(seedFilePath, content, 'utf8');
console.log(`\n🎉 Successfully updated detailed instructions for ${updated} of ${Object.keys(detailedInstructions).length} items in seed_all_recipes.js!`);

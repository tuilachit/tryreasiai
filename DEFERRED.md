# Deferred issues — revisit post-launch

Quality issues observed in pipeline output that are intentionally NOT fixed in v1.
Revisit after real user feedback — some may not matter, others may turn out to be critical.

## Pipeline / output polish
- Dry ingredients (sugar, flour, salt) sometimes show as ml instead of g/tsp after unit normalization. Example: "brown sugar 5 ml". Fix would require distinguishing dry vs wet ingredients before unit conversion.
- Small category mistakes: seeds/nuts occasionally land in "Other" instead of Pantry. Fix is a prompt tweak.
- Ingredient names sometimes include parenthetical modifiers like "beef (sliced)" or "basil leaves (fresh)" despite the "generic name" rule. Fix is a prompt tweak.
- Rice portion occasionally lands at the low end of the range (150 g for 2 people). Fine for a light bowl, tight for a main. Consider bumping the minimum.

## Features explicitly deferred to post-launch
- Real-time supermarket pricing (Woolworths / Coles / Aldi). Current prices are rough model estimates. Revisit after user signal.
- Precise nutrition / macro tracking. Current dietary handling is qualitative. Revisit if users ask.
- In-store mode (aisle locations, alternatives for out-of-stock items). Requires retailer partnership data.
- Recipe instructions step-by-step. Currently only a brief paragraph.
- Saved plans / history. v1 is stateless per session.
- Auth and accounts. v1 uses localStorage for profile.

-- ============================================================================
-- সঞ্জীবন (Shonjibon) — demo seed data
-- Run after 001_init.sql. Safe to re-run (uses deletes first).
-- ============================================================================

truncate table
  product_images, product_specs, product_benefits, process_steps, products, product_categories,
  articles, article_categories, journey_milestones, research_items, test_results,
  impact_stats, community_photos, community_visits, team_members, testimonials,
  faqs, partners, downloads, page_sections,   nav_items, shell_parts
  restart identity cascade;

-- ---------------------------------------------------------------------------
-- Site settings
-- ---------------------------------------------------------------------------
insert into site_settings (key, value) values
  ('motto_en', '"New life from waste"'),
  ('motto_bn', '"বর্জ্য থেকে নতুন জীবন"'),
  ('hero_title_en', '"A water filter made from shrimp shells"'),
  ('hero_title_bn', '"চিংড়ির খোলস থেকে তৈরি পানি ফিল্টার"'),
  ('hero_subtitle_en', '"A low-cost, electricity-free filter built with chitosan — helps reduce arsenic, heavy metals and turbidity."'),
  ('hero_subtitle_bn', '"কাইটোসান প্রযুক্তিতে তৈরি সাশ্রয়ী, বিদ্যুৎবিহীন ফিল্টার — আর্সেনিক, ভারী ধাতু ও ঘোলাত্ব কমাতে সাহায্য করে।"'),
  ('contact_phone', '"01620485218"'),
  ('contact_email', '"usamabenmahmud@gmail.com"'),
  ('contact', '{"phone":"01620485218","email":"usamabenmahmud@gmail.com","address":"Khulna, Bangladesh","hours":"","map_link":"","whatsapp_enabled":false}'),
  ('branding', '{"name_bn":"সঞ্জীবন","name_en":"Shonjibon","show_bangla_name":true,"logo_mark_url":"","logo_full_url":"","logo_dark_url":"","logo_height":40,"use_mark_only":false}'),
  ('sections', '{"hero":true,"impact":true,"shellDiagram":true,"products":true,"circularEconomy":true,"wasteRing":true,"journey":true,"community":true,"articles":true,"team":true,"testimonials":true,"newsletter":true}')
on conflict (key) do update set value = excluded.value;

insert into nav_items (label_en, label_bn, path, group_key, description_en, description_bn, is_visible, sort_order) values
  ('Home', 'হোম', '/', '', 'Return to the Shonjibon homepage.', 'সঞ্জীবন হোমপেজে ফিরে যান।', true, 1),
  ('Shop', 'দোকান', '/products', 'shop', 'Explore filters and shell-based products.', 'ফিল্টার ও খোলস-ভিত্তিক পণ্য দেখুন।', true, 2),
  ('All Products', 'সকল পণ্য', '/products', 'shop', 'Browse every available product.', 'সব পণ্য দেখুন।', true, 3),
  ('Our Concerns', 'আমাদের উদ্বেগ', '/coastal-problem', 'concerns', 'Learn about challenges facing coastal communities.', 'উপকূলীয় এলাকার চ্যালেঞ্জ সম্পর্কে জানুন।', true, 4),
  ('Coastal Area Problem', 'উপকূলীয় এলাকার সমস্যা', '/coastal-problem', 'concerns', 'Water and environmental challenges in coastal Bangladesh.', 'উপকূলীয় বাংলাদেশের পানি ও পরিবেশগত চ্যালেঞ্জ।', true, 5),
  ('Our Concerning Issues', 'আমাদের উদ্বেগের বিষয়', '/concerns', 'concerns', 'Explore the issues our project addresses.', 'আমাদের প্রকল্পের লক্ষ্য বিষয়গুলো দেখুন।', true, 6),
  ('Health And Disease Topics', 'স্বাস্থ্য ও রোগ বিষয়', '/health', 'concerns', 'Read about water-related health concerns.', 'পানিসংশ্লিষ্ট স্বাস্থ্যঝুঁকি জানুন।', true, 7),
  ('Our Work', 'আমাদের কাজ', '/research', 'work', 'Discover research, process, and community work.', 'গবেষণা, প্রক্রিয়া ও কমিউনিটির কাজ দেখুন।', true, 8),
  ('Research', 'গবেষণা', '/research', 'work', 'Explore our methods and findings.', 'আমাদের পদ্ধতি ও ফলাফল দেখুন।', true, 9),
  ('The Shell Story', 'খোলসের গল্প', '/shell', 'work', 'See how shrimp shells become useful products.', 'চিংড়ির খোলস থেকে কীভাবে পণ্য তৈরি হয় দেখুন।', true, 10),
  ('Lab Test Results', 'ল্যাব পরীক্ষার ফলাফল', '/lab-results', 'work', 'Review available testing and verification.', 'পরীক্ষা ও যাচাইয়ের তথ্য দেখুন।', true, 11),
  ('Our Journey', 'আমাদের যাত্রা', '/about', 'work', 'Follow the project from idea to pilot.', 'ধারণা থেকে পাইলট পর্যন্ত যাত্রা দেখুন।', true, 12),
  ('Picture Gallery', 'ছবির গ্যালারি', '/gallery', 'work', 'View moments from the project and community.', 'প্রকল্প ও কমিউনিটির মুহূর্ত দেখুন।', true, 13),
  ('News', 'সংবাদ', '/news', 'news', 'Read the latest news and awareness stories.', 'সাম্প্রতিক সংবাদ ও সচেতনতামূলক লেখা পড়ুন।', true, 14),
  ('News And Awareness', 'সংবাদ ও সচেতনতা', '/news', 'news', 'Read the latest news and awareness stories.', 'সাম্প্রতিক সংবাদ ও সচেতনতামূলক লেখা পড়ুন।', true, 15),
  ('About', 'আমাদের সম্পর্কে', '/about', 'about', 'Meet the people and purpose behind Shonjibon.', 'সঞ্জীবনের মানুষ ও উদ্দেশ্য সম্পর্কে জানুন।', true, 16),
  ('About Us', 'আমাদের সম্পর্কে', '/about', 'about', 'Learn about our mission and vision.', 'আমাদের লক্ষ্য ও দৃষ্টিভঙ্গি জানুন।', true, 17),
  ('Our Team', 'আমাদের দল', '/team', 'about', 'Meet the six core teammates.', 'ছয়জন মূল সদস্যের সঙ্গে পরিচিত হন।', true, 18),
  ('FAQ', 'প্রশ্নোত্তর', '/faq', 'about', 'Find answers to common questions.', 'সাধারণ প্রশ্নের উত্তর খুঁজুন।', true, 19);

insert into page_sections (page_key, type, title_en, title_bn, body_en, body_bn, sort_order) values
  ('coastal', 'cards', 'Groundwater and arsenic', 'ভূগর্ভস্থ পানি ও আর্সেনিক', 'Groundwater quality varies by location. Test water sources and follow public-health guidance.', 'স্থানভেদে ভূগর্ভস্থ পানির মান ভিন্ন। পানির উৎস পরীক্ষা করুন এবং জনস্বাস্থ্য নির্দেশনা মেনে চলুন।', 1),
  ('coastal', 'cards', 'Salinity in drinking water', 'পানীয় পানিতে লবণাক্ততা', 'Saline conditions can make reliable drinking-water access difficult in coastal areas.', 'উপকূলীয় এলাকায় লবণাক্ততা নির্ভরযোগ্য পানীয় জলের প্রাপ্যতা কঠিন করতে পারে।', 2),
  ('coastal', 'cards', 'Electricity and treatment costs', 'বিদ্যুৎ ও শোধন ব্যয়', 'Electricity, maintenance and equipment costs can make some treatment difficult to sustain.', 'বিদ্যুৎ, রক্ষণাবেক্ষণ ও যন্ত্রপাতির ব্যয় কিছু শোধন পদ্ধতি নিয়মিত চালানো কঠিন করতে পারে।', 3),
  ('coastal', 'cards', 'Distance to safe water', 'নিরাপদ পানির দূরত্ব', 'A distant safe source can add time and transport burdens to water collection.', 'নিরাপদ পানির উৎস দূরে হলে পানি সংগ্রহে অতিরিক্ত সময় ও যাতায়াতের চাপ তৈরি হয়।', 4),
  ('coastal', 'cards', 'Shrimp-shell waste', 'চিংড়ির খোলসের বর্জ্য', 'Reusing suitable shell waste can support a circular-economy approach.', 'উপযুক্ত খোলস বর্জ্য পুনর্ব্যবহার বৃত্তাকার অর্থনীতিতে সহায়তা করতে পারে।', 5),
  ('coastal', 'cards', 'A complementary response', 'পরিপূরক উদ্যোগ', 'Shonjibon aims to help reduce arsenic, heavy metals and turbidity. It does not remove salinity or disinfect water.', 'সঞ্জীবন আর্সেনিক, ভারী ধাতু ও ঘোলাত্ব কমাতে সাহায্য করার লক্ষ্য রাখে। এটি লবণাক্ততা দূর বা পানি জীবাণুমুক্ত করে না।', 6),
  ('concerns', 'cards', 'Unsafe drinking water', 'অনিরাপদ পানীয় জল', 'Water quality varies between sources; testing and trusted local guidance matter.', 'উৎসভেদে পানির মান ভিন্ন; পরীক্ষা ও নির্ভরযোগ্য স্থানীয় নির্দেশনা গুরুত্বপূর্ণ।', 1),
  ('concerns', 'cards', 'Cost of treatment', 'শোধনের ব্যয়', 'Equipment, energy and maintenance costs can limit access to treatment.', 'যন্ত্রপাতি, শক্তি ও রক্ষণাবেক্ষণের ব্যয় শোধনের সুযোগ সীমিত করতে পারে।', 2),
  ('concerns', 'cards', 'Shrimp-shell waste', 'চিংড়ির খোলসের বর্জ্য', 'Discarded shells can create a waste burden instead of becoming a useful resource.', 'ফেলে দেওয়া খোলস কাজে লাগার সম্পদ না হয়ে বর্জ্যের বোঝা তৈরি করতে পারে।', 3),
  ('concerns', 'cards', 'Women’s livelihood opportunities', 'নারীদের জীবিকার সুযোগ', 'Fair and safe community-led processing and craft work can create opportunities.', 'ন্যায্য ও নিরাপদ কমিউনিটি-নেতৃত্বাধীন প্রক্রিয়াকরণ ও কারুশিল্পের কাজ সুযোগ তৈরি করতে পারে।', 4),
  ('concerns', 'cards', 'Children and pregnancy', 'শিশু ও গর্ভাবস্থা', 'Children and pregnant people may be more vulnerable to unsafe-water risks; consult health professionals.', 'অনিরাপদ পানির ঝুঁকিতে শিশু ও গর্ভবতীরা বেশি সংবেদনশীল হতে পারেন; স্বাস্থ্যকর্মীর পরামর্শ নিন।', 5),
  ('concerns', 'cards', 'Access to testing', 'পানি পরীক্ষার সুযোগ', 'People need trustworthy water testing and clear explanations of results.', 'নির্ভরযোগ্য পানি পরীক্ষা ও ফলাফলের সহজ ব্যাখ্যা পাওয়ার সুযোগ থাকা দরকার।', 6),
  ('health', 'cards', 'Arsenic exposure', 'আর্সেনিকের সংস্পর্শ', 'Long-term arsenic exposure in drinking water can pose serious health risks. Use tested sources.', 'পানীয় জলে আর্সেনিকের দীর্ঘমেয়াদি সংস্পর্শ গুরুতর স্বাস্থ্যঝুঁকি তৈরি করতে পারে। পরীক্ষিত উৎস ব্যবহার করুন।', 1),
  ('health', 'cards', 'Diarrheal disease and cholera', 'ডায়রিয়াজনিত রোগ ও কলেরা', 'Follow local water-treatment guidance and seek care for dehydration or severe symptoms.', 'স্থানীয় পানি শোধন নির্দেশনা মেনে চলুন এবং পানিশূন্যতা বা গুরুতর লক্ষণে চিকিৎসা নিন।', 2),
  ('health', 'cards', 'Salinity and maternal health', 'লবণাক্ততা ও মাতৃস্বাস্থ্য', 'Discuss drinking-water concerns during pregnancy with a qualified clinician.', 'গর্ভাবস্থায় পানীয় জল নিয়ে উদ্বেগ থাকলে যোগ্য চিকিৎসকের পরামর্শ নিন।', 3),
  ('health', 'cards', 'Skin problems', 'ত্বকের সমস্যা', 'Skin symptoms have many possible causes; ask a healthcare professional for advice.', 'ত্বকের লক্ষণের নানা কারণ থাকতে পারে; স্বাস্থ্যকর্মীর পরামর্শ নিন।', 4),
  ('health', 'cards', 'Practical safety steps', 'পানির নিরাপত্তার পদক্ষেপ', 'Use a tested safe source, store water in clean covered containers and follow local advisories.', 'পরীক্ষিত নিরাপদ উৎস ব্যবহার করুন, পরিষ্কার ঢাকনাযুক্ত পাত্রে পানি রাখুন এবং স্থানীয় পরামর্শ অনুসরণ করুন।', 5);

insert into page_sections (page_key, type, title_en, title_bn, body_en, body_bn, sort_order) values
  ('terms', 'text', 'Terms And Conditions', 'শর্তাবলী', 'Please contact Shonjibon before placing an order if you need product safety, availability, or use information. Product information is provided for general guidance and is not a substitute for professional water testing or public-health advice.', 'পণ্যের নিরাপত্তা, প্রাপ্যতা বা ব্যবহার সম্পর্কে জানতে অর্ডারের আগে সঞ্জীবনের সাথে যোগাযোগ করুন। পণ্যের তথ্য সাধারণ নির্দেশনার জন্য; এটি পেশাদার পানি পরীক্ষা বা জনস্বাস্থ্য পরামর্শের বিকল্প নয়।', 1),
  ('privacy', 'text', 'Privacy Policy', 'গোপনীয়তা নীতি', 'We use information submitted through forms and checkout to respond to requests and process orders. Contact the site team to request access, correction, or deletion of personal information, subject to legal record-keeping requirements.', 'ফর্ম ও চেকআউটে দেওয়া তথ্য অনুরোধের উত্তর ও অর্ডার প্রক্রিয়াকরণে ব্যবহার করা হয়। আইনি রেকর্ড সংরক্ষণের বাধ্যবাধকতা সাপেক্ষে ব্যক্তিগত তথ্য দেখা, সংশোধন বা মুছে ফেলার অনুরোধে সাইট টিমের সাথে যোগাযোগ করুন।', 1),
  ('refund', 'text', 'Refund And Returns', 'ফেরত ও রিফান্ড', 'Contact us with your order number as soon as possible if an item arrives damaged or incorrect. We will review the request and explain the available replacement or refund options before processing.', 'পণ্য ক্ষতিগ্রস্ত বা ভুল হলে অর্ডার নম্বরসহ যত দ্রুত সম্ভব যোগাযোগ করুন। প্রক্রিয়াকরণের আগে আমরা অনুরোধ পর্যালোচনা করে প্রতিস্থাপন বা রিফান্ডের সুযোগ জানাব।', 1),
  ('shipping', 'text', 'Shipping Policy', 'শিপিং নীতি', 'Delivery availability, fees, and estimated times are confirmed during order processing. We will contact you if the delivery address cannot be served or if an estimated delivery window changes.', 'ডেলিভারির সুযোগ, ফি ও আনুমানিক সময় অর্ডার প্রক্রিয়ার সময় নিশ্চিত করা হয়। ঠিকানায় ডেলিভারি সম্ভব না হলে বা সময় পরিবর্তন হলে আমরা যোগাযোগ করব।', 1);

-- ---------------------------------------------------------------------------
-- Products
-- ---------------------------------------------------------------------------
insert into products (slug, name_en, name_bn, tagline_en, tagline_bn, overview_en, overview_bn, trust_line_en, trust_line_bn, price, price_note_en, price_note_bn, stock_status, is_flagship, is_published, cover_image, sort_order) values
('shonjibon-water-filter', 'Shonjibon Water Filter', 'সঞ্জীবন ওয়াটার ফিল্টার',
 'Gravity-fed, electricity-free, 5-layer filtration', 'মাধ্যাকর্ষণ-চালিত, বিদ্যুৎবিহীন ৫-স্তর ফিল্টার',
 'Our flagship filter uses five layers — fine sand, a swappable chitosan cartridge, activated charcoal, sand, and coarse gravel — to help reduce arsenic, heavy metals and turbidity in household water, without electricity or moving parts.',
 'আমাদের ফ্ল্যাগশিপ ফিল্টারে পাঁচটি স্তর রয়েছে — সূক্ষ্ম বালি, পরিবর্তনযোগ্য কাইটোসান কার্তুজ, সক্রিয় কাঠকয়লা, বালি এবং মোটা নুড়িপাথর — যা বিদ্যুৎ ছাড়াই বাড়ির পানিতে আর্সেনিক, ভারী ধাতু ও ঘোলাত্ব কমাতে সাহায্য করে।',
 'Lab-tested with sample results; built with coastal households in mind.', 'নমুনা ফলাফল সহ ল্যাব-পরীক্ষিত; উপকূলীয় পরিবারের কথা মাথায় রেখে তৈরি।',
 1800, 'Includes one chitosan cartridge; replacements sold separately.', 'একটি কাইটোসান কার্তুজ অন্তর্ভুক্ত; পরিবর্তনের কার্তুজ আলাদাভাবে পাওয়া যায়।',
 'preorder', true, true, '', 1),
('shonjibon-soyad', 'Shonjibon Soyad', 'সঞ্জীবন সোয়াদ',
 'Shrimp-shell flour, a natural umami booster', 'চিংড়ির খোলসের গুঁড়া, প্রাকৃতিক উমামি বর্ধক',
 'A fine flour milled from cleaned, dried shrimp shells. A pinch deepens the savoury flavour of soups, bhortas and curries.',
 'পরিষ্কার ও শুকনো চিংড়ির খোলস থেকে তৈরি মিহি গুঁড়া। সামান্য পরিমাণ স্যুপ, ভর্তা ও তরকারির স্বাদ গভীর করে তোলে।',
 'Made in small batches; lab-checked for cleanliness.', 'ছোট ব্যাচে তৈরি; পরিচ্ছন্নতার জন্য ল্যাবে পরীক্ষিত।',
 150, '100g resealable pouch.', '১০০ গ্রাম পুনঃবন্ধনযোগ্য প্যাকেট।',
 'in_stock', false, true, '', 2),
('shell-craft-ornaments', 'Shell-craft Ornaments', 'শেল-ক্রাফট অলংকার',
 'Handmade jewelry by women artisans', 'নারী কারিগরদের হাতে তৈরি গহনা',
 'Earrings, pendants and bangles hand-shaped from cleaned shrimp-shell pieces by local women artisans.',
 'স্থানীয় নারী কারিগরদের হাতে পরিষ্কার চিংড়ির খোলসের টুকরা থেকে তৈরি কানের দুল, পেন্ডেন্ট ও চুড়ি।',
 'Every purchase supports artisan income.', 'প্রতিটি কেনাকাটা কারিগরদের আয়ে সহায়তা করে।',
 250, 'Price varies by design; shown is the starting price.', 'ডিজাইন অনুযায়ী দাম ভিন্ন হতে পারে; এখানে সর্বনিম্ন মূল্য দেখানো হয়েছে।',
 'in_stock', false, true, '', 3),
('chitoclear', 'ChitoClear', 'কাইটোক্লিয়ার',
 'Chitosan water clarifier', 'কাইটোসান পানি স্বচ্ছকারী',
 'A chitosan powder diluted in vinegar that helps clarify cloudy water. Mix, stir, let settle, then decant the clear water.',
 'ভিনেগারে মিশ্রিত কাইটোসান গুঁড়া যা ঘোলা পানি স্বচ্ছ করতে সাহায্য করে। মিশিয়ে নিন, নাড়ুন, থিতিয়ে যেতে দিন, তারপর স্বচ্ছ পানি আলাদা করুন।',
 'Simple 4-step use; no equipment needed.', 'সহজ ৪-ধাপ ব্যবহার; কোনো যন্ত্রপাতি প্রয়োজন নেই।',
 120, '50g bottle, diluted in household vinegar.', '৫০ গ্রাম বোতল, বাসার ভিনেগারে মিশিয়ে ব্যবহার করুন।',
 'preorder', false, true, '', 4),
('agri-shelf-life-powder', 'Agri Shelf-Life Powder', 'কৃষি শেল্ফ-লাইফ গুঁড়া',
 'Chitosan coating for produce and seeds', 'ফসল ও বীজের জন্য কাইটোসান আবরণ',
 'A thin chitosan coating applied to fruits, vegetables or seeds to help extend shelf life and reduce spoilage.',
 'ফল, সবজি বা বীজে প্রয়োগের জন্য পাতলা কাইটোসান আবরণ, যা মেয়াদ বাড়াতে ও নষ্ট হওয়া কমাতে সাহায্য করে।',
 'Field trials ongoing with local farmers.', 'স্থানীয় কৃষকদের সাথে মাঠ পরীক্ষা চলমান।',
 200, '100g pack, dilute before use.', '১০০ গ্রাম প্যাক, ব্যবহারের আগে পাতলা করুন।',
 'coming_soon', false, true, '', 5);

insert into product_categories (slug, name_en, name_bn, sort_order, is_published) values
  ('water-filters', 'Water filters', 'পানি ফিল্টার', 1, true),
  ('shell-byproducts', 'Shell by-products', 'খোলসের উপজাত', 2, true)
on conflict (slug) do update
set name_en = excluded.name_en,
    name_bn = excluded.name_bn,
    sort_order = excluded.sort_order,
    is_published = excluded.is_published;

update products
set category_id = (select id from product_categories where slug = 'water-filters')
where slug = 'shonjibon-water-filter';

update products
set category_id = (select id from product_categories where slug = 'shell-byproducts')
where slug in ('shonjibon-soyad', 'shell-craft-ornaments', 'chitoclear', 'agri-shelf-life-powder');

insert into shell_parts(key, name_en, name_bn, description_en, description_bn, icon, color, hotspot_x, hotspot_y, linked_product_ids, sort_order) values
('carapace', 'Carapace', 'মাথার খোলস', 'The hard head shell contains chitin, minerals, and proteins.', 'শক্ত মাথার খোলসে কাইটিন, খনিজ ও প্রোটিন থাকে।', 'shell', 'coral', 29, 39, array[(select id from products where slug = 'shonjibon-water-filter'), (select id from products where slug = 'chitoclear'), (select id from products where slug = 'agri-shelf-life-powder')], 1),
('abdomen', 'Abdomen plates', 'পেটের খোলস', 'The overlapping body plates are cleaned and prepared for processing.', 'একটির ওপর আরেকটি থাকা দেহের খোলস পরিষ্কার করে প্রক্রিয়ার জন্য প্রস্তুত করা হয়।', 'layers', 'coral', 60, 50, array[(select id from products where slug = 'shonjibon-water-filter'), (select id from products where slug = 'chitoclear')], 2),
('tail', 'Tail fan', 'লেজের পাখা', 'The tail fan is another part of the shell material that can be reused.', 'লেজের পাখাও পুনর্ব্যবহারযোগ্য খোলসের অংশ।', 'reuse', 'teal', 83, 59, array[(select id from products where slug = 'shell-craft-ornaments')], 3),
('layers', 'Shell layers', 'খোলসের স্তর', 'Shells contain a protein surface, chitin-protein fibers, and mineral material. Exact composition varies.', 'খোলসে প্রোটিনের উপরিভাগ, কাইটিন-প্রোটিন তন্তু ও খনিজ থাকে। সঠিক অনুপাত ভিন্ন হতে পারে।', 'layers', 'teal', 44, 75, array[(select id from products where slug = 'shonjibon-soyad'), (select id from products where slug = 'shell-craft-ornaments')], 4);

-- Global process steps for the flagship filter
insert into process_steps (product_id, step_no, title_en, title_bn, body_en, body_bn, icon, sort_order)
select id, 1, 'Collect', 'সংগ্রহ', 'Shrimp shells collected from Chuknagar and MU Sea Food.', 'চুকনগর ও এমইউ সি ফুড থেকে চিংড়ির খোলস সংগ্রহ করা হয়।', 'truck', 1
from products where slug = 'shonjibon-water-filter'
union all
select id, 2, 'Clean & dry', 'পরিষ্কার ও শুকানো', 'Shells are washed, sun-dried and ground.', 'খোলস ধোয়া, রোদে শুকানো ও গুঁড়া করা হয়।', 'sun', 2
from products where slug = 'shonjibon-water-filter'
union all
select id, 3, 'Extract chitosan', 'কাইটোসান নিষ্কাশন', 'Demineralization, deproteinization and deacetylation yield chitosan.', 'ডিমিনারেলাইজেশন, ডিপ্রোটিনাইজেশন ও ডিএসিটাইলেশনের মাধ্যমে কাইটোসান পাওয়া যায়।', 'flask', 3
from products where slug = 'shonjibon-water-filter'
union all
select id, 4, 'Build & test', 'তৈরি ও পরীক্ষা', 'Cartridges are assembled and lab-tested.', 'কার্তুজ তৈরি ও ল্যাবে পরীক্ষা করা হয়।', 'check', 4
from products where slug = 'shonjibon-water-filter';

insert into product_benefits (product_id, icon, title_en, title_bn, body_en, body_bn, sort_order)
select id, 'droplet', 'Reduces arsenic & heavy metals', 'আর্সেনিক ও ভারী ধাতু কমায়', 'Chitosan binds contaminants as water passes through.', 'পানি অতিক্রমের সময় কাইটোসান দূষক আটকে ফেলে।', 1 from products where slug = 'shonjibon-water-filter'
union all
select id, 'bolt-off', 'No electricity needed', 'বিদ্যুতের প্রয়োজন নেই', 'Works anywhere with just gravity.', 'শুধু মাধ্যাকর্ষণেই যেকোনো জায়গায় কাজ করে।', 2 from products where slug = 'shonjibon-water-filter'
union all
select id, 'leaf', 'Natural umami', 'প্রাকৃতিক উমামি', 'No artificial flavouring.', 'কোনো কৃত্রিম স্বাদ নেই।', 1 from products where slug = 'shonjibon-soyad'
union all
select id, 'heart', 'Supports artisans', 'কারিগরদের সহায়তা করে', 'Fair pay for every handmade piece.', 'প্রতিটি হাতে তৈরি পণ্যের জন্য ন্যায্য মজুরি।', 1 from products where slug = 'shell-craft-ornaments'
union all
select id, 'droplet', 'Clarifies cloudy water', 'ঘোলা পানি স্বচ্ছ করে', 'Helps turbidity settle out faster.', 'ঘোলাত্ব দ্রুত থিতিয়ে যেতে সাহায্য করে।', 1 from products where slug = 'chitoclear'
union all
select id, 'leaf', 'Extends shelf life', 'মেয়াদ বাড়ায়', 'Early trials show reduced spoilage (sample).', 'প্রাথমিক পরীক্ষায় কম নষ্ট হওয়ার ইঙ্গিত (নমুনা)।', 1 from products where slug = 'agri-shelf-life-powder';

insert into product_specs (product_id, label_en, label_bn, value_en, value_bn, sort_order)
select id, 'Flow rate', 'প্রবাহ হার', '~1.5 L / 10 min (sample)', '~১.৫ লিটার / ১০ মিনিট (নমুনা)', 1 from products where slug = 'shonjibon-water-filter'
union all
select id, 'Capacity', 'ধারণক্ষমতা', '12 L reservoir', '১২ লিটার পাত্র', 2 from products where slug = 'shonjibon-water-filter'
union all
select id, 'Power needed', 'বিদ্যুৎ প্রয়োজন', 'None — fully gravity-fed', 'প্রয়োজন নেই — সম্পূর্ণ মাধ্যাকর্ষণ-চালিত', 3 from products where slug = 'shonjibon-water-filter'
union all
select id, 'Net weight', 'নিট ওজন', '100 g', '১০০ গ্রাম', 1 from products where slug = 'shonjibon-soyad';

-- ---------------------------------------------------------------------------
-- Article categories + articles
-- ---------------------------------------------------------------------------
insert into article_categories (slug, name_en, name_bn, sort_order) values
('water-borne-diseases', 'Water-borne diseases', 'পানিবাহিত রোগ', 1),
('arsenic-awareness', 'Arsenic awareness', 'আর্সেনিক সচেতনতা', 2),
('water-safety-tips', 'Water safety tips', 'পানি নিরাপত্তা পরামর্শ', 3),
('research-updates', 'Research updates', 'গবেষণার হালনাগাদ', 4),
('field-visit-stories', 'Field visit stories', 'মাঠ পরিদর্শনের গল্প', 5);

insert into articles (slug, category_id, title_en, title_bn, excerpt_en, excerpt_bn, body_en, body_bn, cover_image, author, status, published_at)
select 'why-arsenic-is-a-silent-crisis', (select id from article_categories where slug = 'arsenic-awareness'),
 'Why arsenic is a silent crisis in coastal Bangladesh', 'কেন আর্সেনিক উপকূলীয় বাংলাদেশে নীরব এক সংকট',
 'Arsenic in groundwater has no taste or smell.', 'ভূগর্ভস্থ পানিতে আর্সেনিকের কোনো স্বাদ বা গন্ধ নেই।',
 '<p>Arsenic contamination affects millions across Bangladesh.</p>', '<p>আর্সেনিক দূষণ বাংলাদেশের লক্ষ লক্ষ মানুষকে প্রভাবিত করে।</p>',
 '', 'Parboti Rani Sarkar', 'published', now()
union all
select 'five-signs-of-water-borne-illness', (select id from article_categories where slug = 'water-borne-diseases'),
 'Five early signs of water-borne illness', 'পানিবাহিত রোগের পাঁচটি প্রাথমিক লক্ষণ',
 'Recognising symptoms early prevents complications.', 'প্রাথমিক পর্যায়ে লক্ষণ চিনতে পারলে জটিলতা এড়ানো যায়।',
 '<p>Diarrhoea, stomach cramps and fatigue are common early signs.</p>', '<p>ডায়রিয়া, পেট ব্যথা ও ক্লান্তি সাধারণ প্রাথমিক লক্ষণ।</p>',
 '', 'Samia Islam Jim', 'published', now()
union all
select 'sodis-solar-disinfection-explained', (select id from article_categories where slug = 'water-safety-tips'),
 'SODIS: solar disinfection explained simply', 'সোডিস: সহজভাবে সৌর জীবাণুমুক্তকরণ বোঝা',
 'Clear bottles, direct sunlight, six hours.', 'স্বচ্ছ বোতল, সরাসরি রোদ, ছয় ঘণ্টা।',
 '<p>SODIS uses UV rays from sunlight to inactivate many pathogens.</p>', '<p>সোডিস সূর্যের অতিবেগুনি রশ্মি ব্যবহার করে জীবাণু নিষ্ক্রিয় করে।</p>',
 '', 'Anika Tabassum Akhy', 'published', now()
union all
select 'inside-our-chitosan-extraction-lab', (select id from article_categories where slug = 'research-updates'),
 'Inside our chitosan extraction process', 'আমাদের কাইটোসান নিষ্কাশন প্রক্রিয়ার ভেতরে',
 'Four lab steps turn waste into a purifying material.', 'চারটি ল্যাব ধাপ বর্জ্যকে বিশুদ্ধকারী উপাদানে রূপান্তর করে।',
 '<p>From cleaning to deacetylation, each step refines the shell.</p>', '<p>পরিষ্কার করা থেকে ডিএসিটাইলেশন পর্যন্ত প্রতিটি ধাপ খোলসকে পরিশুদ্ধ করে।</p>',
 '', 'Usama Ben Mahmud', 'published', now()
union all
select 'a-morning-at-chuknagar', (select id from article_categories where slug = 'field-visit-stories'),
 'A morning at Chuknagar: where our journey begins', 'চুকনগরে একটি সকাল: যেখানে আমাদের যাত্রা শুরু',
 'Shell collection starts at the market.', 'খোলস সংগ্রহ শুরু হয় বাজারে।',
 '<p>Every week, our team visits Chuknagar''s shrimp market.</p>', '<p>প্রতি সপ্তাহে আমাদের টিম চুকনগরের চিংড়ি বাজারে যায়।</p>',
 '', 'Mrinmoy Mondal', 'published', now()
union all
select 'visiting-mu-sea-food', (select id from article_categories where slug = 'field-visit-stories'),
 'Visiting MU Sea Food: a partnership in waste', 'এমইউ সি ফুড পরিদর্শন: বর্জ্যে একটি অংশীদারিত্ব',
 'Manager Shubrato Babu walked us through the plant.', 'ম্যানেজার শুভ্রত বাবু আমাদের কারখানা ঘুরিয়ে দেখিয়েছেন।',
 '<p>MU Sea Food processes large volumes of shrimp for export.</p>', '<p>এমইউ সি ফুড রপ্তানির জন্য প্রচুর চিংড়ি প্রক্রিয়াজাত করে।</p>',
 '', 'Jannatul Mawoa Esha', 'published', now();

-- ---------------------------------------------------------------------------
-- Journey, research, testing, impact
-- ---------------------------------------------------------------------------
insert into journey_milestones (date_label_en, date_label_bn, title_en, title_bn, body_en, body_bn, image, sort_order) values
('Jan 2026', 'জানুয়ারি ২০২৬', 'Idea & research begins', 'ধারণা ও গবেষণা শুরু', 'Team forms under JUST Cohort 2026.', 'JUST কোহর্ট ২০২৬-এর অধীনে টিম গঠিত হয়।', '', 1),
('Feb 2026', 'ফেব্রুয়ারি ২০২৬', 'First shell collection', 'প্রথম খোলস সংগ্রহ', 'Visited Chuknagar market for raw shells.', 'কাঁচা খোলসের জন্য চুকনগর বাজার পরিদর্শন।', '', 2),
('Mar 2026', 'মার্চ ২০২৬', 'Lab extraction trials', 'ল্যাব নিষ্কাশন পরীক্ষা', 'First chitosan batches produced.', 'প্রথম কাইটোসান ব্যাচ তৈরি হয়।', '', 3),
('Apr 2026', 'এপ্রিল ২০২৬', 'First filter prototype', 'প্রথম ফিল্টার প্রোটোটাইপ', '5-layer design assembled and tested.', '৫-স্তর ডিজাইন তৈরি ও পরীক্ষা করা হয়।', '', 4),
('May 2026', 'মে ২০২৬', 'MU Sea Food partnership', 'এমইউ সি ফুড অংশীদারিত্ব', 'Secured a steady shell supply chain.', 'স্থিতিশীল খোলস সরবরাহ ব্যবস্থা নিশ্চিত করা হয়।', '', 5),
('Jun 2026', 'জুন ২০২৬', 'Pitch & pilot households', 'পিচ ও পাইলট পরিবার', 'First pilot filters placed with households.', 'পাইলট ফিল্টার প্রথম পরিবারগুলোতে স্থাপন করা হয়।', '', 6);

insert into research_items (type, title_en, title_bn, body_en, body_bn, image, sort_order) values
('method', '1. Cleaning', '১. পরিষ্কারকরণ', 'Shells are washed to remove residual tissue and debris.', 'অবশিষ্ট মাংস ও ময়লা দূর করতে খোলস ধোয়া হয়।', '', 1),
('method', '2. Demineralization', '২. ডিমিনারেলাইজেশন', 'Dilute acid removes calcium carbonate.', 'হালকা অ্যাসিড ক্যালসিয়াম কার্বনেট দূর করে।', '', 2),
('method', '3. Deproteinization', '৩. ডিপ্রোটিনাইজেশন', 'Dilute alkali removes proteins, leaving raw chitin.', 'হালকা ক্ষার প্রোটিন দূর করে কাঁচা কাইটিন রেখে যায়।', '', 3),
('method', '4. Deacetylation', '৪. ডিএসিটাইলেশন', 'Concentrated alkali under heat converts chitin into chitosan.', 'তাপে ঘন ক্ষার কাইটিনকে কাইটোসানে রূপান্তর করে।', '', 4),
('finding', 'Turbidity drops sharply', 'ঘোলাত্ব দ্রুত কমে', 'Sample testing shows a large reduction after filtration.', 'নমুনা পরীক্ষায় বড় হ্রাস দেখা যায়।', '', 5),
('limitation', 'Not a substitute for lab-grade systems', 'ল্যাব-গ্রেড সিস্টেমের বিকল্প নয়', 'Household results vary with source water quality.', 'উৎস পানির মানভেদে ফলাফল ভিন্ন হতে পারে।', '', 6),
('limitation', 'Does not remove salinity', 'লবণাক্ততা দূর করে না', 'Pair with rainwater harvesting in saline-prone areas.', 'লবণাক্ত এলাকায় বৃষ্টির পানি সংগ্রহের সাথে ব্যবহার করুন।', '', 7);

insert into test_results (parameter_en, parameter_bn, unit, raw_value, filtered_value, control_value, standard_value, standard_source, lab_name, sample_date, status, sort_order) values
('Turbidity', 'ঘোলাত্ব', 'NTU', 38, 4.2, 36, 10, 'ECR/DPHE', 'University lab (sample)', now(), 'sample', 1),
('pH', 'পিএইচ', 'pH', 6.4, 7.0, 6.5, 7.5, 'WHO', 'University lab (sample)', now(), 'sample', 2),
('TDS', 'টিডিএস', 'mg/L', 620, 540, 610, 1000, 'ECR/DPHE', 'University lab (sample)', now(), 'sample', 3),
('Arsenic', 'আর্সেনিক', 'mg/L', 0.09, 0.02, 0.08, 0.05, 'ECR/DPHE', 'University lab (sample)', now(), 'sample', 4),
('Iron', 'আয়রন', 'mg/L', 1.2, 0.4, 1.1, 0.3, 'ECR/DPHE', 'University lab (sample)', now(), 'sample', 5),
('Chloride', 'ক্লোরাইড', 'mg/L', 410, 395, 405, 600, 'ECR/DPHE', 'University lab (sample)', now(), 'sample', 6),
('Lead', 'সীসা', 'mg/L', 0.02, 0.004, 0.018, 0.01, 'WHO', 'University lab (sample)', now(), 'sample', 7),
('Cadmium', 'ক্যাডমিয়াম', 'mg/L', 0.006, 0.001, 0.006, 0.003, 'WHO', 'University lab (sample)', now(), 'sample', 8),
('E. coli', 'ই-কোলাই', 'CFU/100mL', null, null, null, 0, 'WHO', 'Pending partner lab', null, 'pending', 9);

insert into impact_stats (label_en, label_bn, value, prefix, suffix, is_sample, status, icon, description_en, description_bn, link, size, is_featured, sort_order) values
('Shell waste diverted', 'পুনর্ব্যবহৃত খোলস', 180, '', ' kg', true, 'sample', '♻', 'Illustrative sample only; replace with measured collection data.', 'শুধু নমুনা; প্রকৃত সংগ্রহের তথ্য দিয়ে পরিবর্তন করুন।', '/community', 'L', true, 1),
('Products from one waste', 'এক বর্জ্য থেকে পণ্য', 5, '', '', false, 'target', '✳', 'One filter and four shell-based byproducts.', 'একটি ফিল্টার ও খোলস-ভিত্তিক চারটি উপজাত পণ্য।', '/shell', 'M', false, 2),
('Districts we target', 'লক্ষ্য জেলা', 3, '', '', false, 'target', '⌖', 'Satkhira, Khulna, and Bagerhat.', 'সাতক্ষীরা, খুলনা ও বাগেরহাট।', '/coastal-problem', 'M', false, 3),
('Women in shell work', 'খোলসের কাজে নারী', 0, '', '', false, 'target', '♡', 'A target for inclusive collection and crafts.', 'অন্তর্ভুক্তিমূলক সংগ্রহ ও কারুশিল্পের লক্ষ্য।', '/community', 'S', false, 4),
('People at risk in target area', 'লক্ষ্য এলাকার ঝুঁকিতে থাকা মানুষ', 2500000, '≈', '', true, 'sample', '◎', 'Approximate illustrative figure; add a credible source before presenting as verified.', 'আনুমানিক নমুনা তথ্য; যাচাইকৃত হিসেবে দেখানোর আগে নির্ভরযোগ্য উৎস যোগ করুন।', '/coastal-problem', 'M', false, 5),
('Lab tests completed', 'সম্পন্ন ল্যাব পরীক্ষা', 0, '', ' / 8', false, 'target', '⌕', 'Completed verified tests compared with the planned set.', 'পরিকল্পিত পরীক্ষার তুলনায় সম্পন্ন যাচাইকৃত পরীক্ষা।', '/lab-results', 'M', false, 6),
('Pilot households', 'পাইলট পরিবার', 12, '', '+', false, 'target', '⌂', 'A target for a future community pilot.', 'ভবিষ্যৎ কমিউনিটি পাইলটের লক্ষ্য।', '/community', 'S', false, 7);

-- ---------------------------------------------------------------------------
-- Community visits + photos
-- ---------------------------------------------------------------------------
insert into community_visits (title_en, title_bn, description_en, description_bn, visit_date, cover_image, sort_order) values
('Chuknagar shell collection', 'চুকনগর খোলস সংগ্রহ', 'Weekly collection trips to Chuknagar shrimp market.', 'চুকনগর চিংড়ি বাজারে সাপ্তাহিক সংগ্রহ সফর।', now(), '', 1),
('MU Sea Food visit', 'এমইউ সি ফুড পরিদর্শন', 'Touring the processing line with manager Shubrato Babu.', 'ম্যানেজার শুভ্রত বাবুর সাথে প্রক্রিয়াকরণ লাইন ঘুরে দেখা।', now(), '', 2),
('Lab shell-grinding day', 'ল্যাব খোলস-গুঁড়াকরণ দিন', 'Grinding and preparing shells for chitosan extraction.', 'কাইটোসান নিষ্কাশনের জন্য খোলস গুঁড়া ও প্রস্তুত করা।', now(), '', 3);

insert into community_photos (visit_id, url, caption_en, caption_bn, sort_order)
select id, '', 'Chuknagar — moment ' || gs, 'চুকনগর — মুহূর্ত ' || gs, gs
from community_visits, generate_series(1, 4) gs where title_en = 'Chuknagar shell collection'
union all
select id, '', 'MU Sea Food — moment ' || gs, 'এমইউ সি ফুড — মুহূর্ত ' || gs, gs
from community_visits, generate_series(1, 4) gs where title_en = 'MU Sea Food visit'
union all
select id, '', 'Lab — moment ' || gs, 'ল্যাব — মুহূর্ত ' || gs, gs
from community_visits, generate_series(1, 3) gs where title_en = 'Lab shell-grinding day';

-- ---------------------------------------------------------------------------
-- Team, testimonials, faqs, partners, downloads
-- ---------------------------------------------------------------------------
insert into team_members (group_type, name, title_en, title_bn, department, bio_en, bio_bn, sort_order) values
('team', 'Usama Ben Mahmud', 'Team Lead & Technology', 'টিম লিড ও প্রযুক্তি', 'Mathematics', 'Leads technical design and overall direction.', 'প্রযুক্তিগত নকশা ও সামগ্রিক দিকনির্দেশনার নেতৃত্ব দেন।', 1),
('team', 'Parboti Rani Sarkar', 'Lead Researcher, Lab & Environment', 'প্রধান গবেষক, ল্যাব ও পরিবেশ', 'Environmental Science', 'Oversees lab research and environmental testing.', 'ল্যাব গবেষণা ও পরিবেশগত পরীক্ষা তত্ত্বাবধান করেন।', 2),
('team', 'Anika Tabassum Akhy', 'Communication & Lab Associate', 'যোগাযোগ ও ল্যাব সহযোগী', 'Communication', 'Bridges lab work and public communication.', 'ল্যাবের কাজ ও জনসাধারণের যোগাযোগের সেতুবন্ধন তৈরি করেন।', 3),
('team', 'Jannatul Mawoa Esha', 'Finance & Budget Manager', 'অর্থ ও বাজেট ব্যবস্থাপক', 'Finance', 'Manages budgeting and financial planning.', 'বাজেট ও আর্থিক পরিকল্পনা পরিচালনা করেন।', 4),
('team', 'Mrinmoy Mondal', 'Marketing & Creative Lead', 'মার্কেটিং ও ক্রিয়েটিভ লিড', 'Marketing', 'Leads storytelling, branding and outreach.', 'গল্প বলা, ব্র্যান্ডিং ও প্রচারণার নেতৃত্ব দেন।', 5),
('team', 'Samia Islam Jim', 'Food Safety & Quality Testing Lead', 'খাদ্য নিরাপত্তা ও মান পরীক্ষা প্রধান', 'Food Science', 'Leads quality and food-safety testing.', 'মান ও খাদ্য-নিরাপত্তা পরীক্ষার নেতৃত্ব দেন।', 6);

insert into testimonials (name, role_en, role_bn, quote_en, quote_bn, is_sample, sort_order) values
('Rahima Begum', 'Pilot household, Khulna', 'পাইলট পরিবার, খুলনা', 'The water looks and tastes much cleaner now. (Sample feedback)', 'পানি এখন অনেক পরিষ্কার দেখায় ও লাগে। (নমুনা মতামত)', true, 1),
('Dr. Farhana Kabir', 'Environmental scientist', 'পরিবেশ বিজ্ঞানী', 'A promising low-cost approach worth piloting further. (Sample feedback)', 'আরও পরীক্ষা করার মতো একটি সম্ভাবনাময় সাশ্রয়ী পদ্ধতি। (নমুনা মতামত)', true, 2),
('Jahangir Alam', 'Local trader, Chuknagar', 'স্থানীয় ব্যবসায়ী, চুকনগর', 'Good to see our shell waste used for something useful. (Sample feedback)', 'আমাদের খোলসের বর্জ্য কাজে লাগতে দেখে ভালো লাগছে। (নমুনা মতামত)', true, 3);

insert into faqs (question_en, question_bn, answer_en, answer_bn, sort_order) values
('Does the filter remove salinity?', 'ফিল্টার কি লবণাক্ততা দূর করে?', 'No. The Shonjibon filter does not remove salinity. Pair it with rainwater harvesting in saline-prone areas.', 'না। সঞ্জীবন ফিল্টার লবণাক্ততা দূর করে না। লবণাক্ত এলাকায় বৃষ্টির পানি সংগ্রহের সাথে এটি ব্যবহার করুন।', 1),
('Does it kill germs or bacteria?', 'এটি কি জীবাণু বা ব্যাকটেরিয়া মারে?', 'The filter is not designed for germ removal. Use SODIS solar disinfection or boiling alongside it.', 'ফিল্টারটি জীবাণু দূর করার জন্য তৈরি নয়। এর সাথে সোডিস বা ফুটানো ব্যবহার করুন।', 2),
('How often should the cartridge be replaced?', 'কার্তুজ কতদিন পরপর পরিবর্তন করতে হয়?', 'Roughly every two months for an average household (sample estimate).', 'গড় পরিবারের জন্য প্রায় প্রতি দুই মাসে একবার (নমুনা অনুমান)।', 3),
('Where do the shrimp shells come from?', 'চিংড়ির খোলস কোথা থেকে আসে?', 'We collect them from Chuknagar market and MU Sea Food processing plant.', 'আমরা এগুলো চুকনগর বাজার ও এমইউ সি ফুড কারখানা থেকে সংগ্রহ করি।', 4),
('Is the shrimp-shell flour safe for people with allergies?', 'শেলফিশ অ্যালার্জি থাকলে কি গুঁড়া নিরাপদ?', 'No — Shonjibon Soyad contains shellfish and is not suitable for people with shellfish allergies.', 'না — সঞ্জীবন সোয়াদে শেলফিশ রয়েছে এবং অ্যালার্জি থাকলে উপযুক্ত নয়।', 5);

insert into partners (name, url, sort_order) values
('BRAC Amra Notun Network', 'https://amranotun.com', 1),
('JUST Cohort 2026', '', 2),
('MU Sea Food', '', 3);

insert into downloads (title_en, title_bn, file_url, file_type, sort_order) values
('One-page project brief (sample)', 'এক পৃষ্ঠার প্রকল্প সংক্ষিপ্তসার (নমুনা)', '#', 'pdf', 1),
('Lab testing summary (sample)', 'ল্যাব পরীক্ষার সারাংশ (নমুনা)', '#', 'pdf', 2);

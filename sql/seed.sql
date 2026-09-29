-- ---------------------------------------------------------------------------
-- EWRAP demo seed data.
--
-- Every account below uses the demo password: password123
-- (bcrypt hash generated with `node scripts/hash-password.js "password123"`).
-- Change these credentials before any deployment that is not local.
--
-- Recycling centre locations are illustrative Calabar coordinates for
-- demonstration. They are honest placeholders: only confirm certification and
-- exact positions with the operators before relying on them.
-- ---------------------------------------------------------------------------

SET NAMES utf8mb4;

INSERT INTO users (userId, fullName, email, passwordHash, role, affiliation, createdAt) VALUES
  (1, 'EWRAP Administrator', 'admin@ewrap.local',  '$2a$10$hLDg94nAX6AquWuKSFCvlOzNAUFr1T1W4ZdJxUDgTaDw6WxKOxYJe', 'Administrator',  'Staff',    NOW() - INTERVAL 210 DAY),
  (2, 'Ada Okon',            'ada@ewrap.local',    '$2a$10$hLDg94nAX6AquWuKSFCvlOzNAUFr1T1W4ZdJxUDgTaDw6WxKOxYJe', 'RegisteredUser', 'Student',  NOW() - INTERVAL 180 DAY),
  (3, 'James Duke',          'james@ewrap.local',  '$2a$10$hLDg94nAX6AquWuKSFCvlOzNAUFr1T1W4ZdJxUDgTaDw6WxKOxYJe', 'RegisteredUser', 'Staff',    NOW() - INTERVAL 165 DAY),
  (4, 'Grace Bassey',        'grace@ewrap.local',  '$2a$10$hLDg94nAX6AquWuKSFCvlOzNAUFr1T1W4ZdJxUDgTaDw6WxKOxYJe', 'RegisteredUser', 'Business', NOW() - INTERVAL 120 DAY),
  (5, 'Read-only Visitor',   'visitor@ewrap.local','$2a$10$hLDg94nAX6AquWuKSFCvlOzNAUFr1T1W4ZdJxUDgTaDw6WxKOxYJe', 'PublicUser',     'Public',   NOW() - INTERVAL 60 DAY);

INSERT INTO recycling_centers (centerId, name, address, latitude, longitude, certifiedStatus, contactInfo, description, addedBy, createdAt) VALUES
  (1, 'UNICROSS Green Collection Point', 'UNICROSS main campus, Calabar', 4.951800, 8.341700, 'Unverified', 'Campus Works Department, UNICROSS', 'Staffed campus collection point for laptop, phone and small-appliance drop-off. Accepts items during working hours only.', 1, NOW() - INTERVAL 200 DAY),
  (2, 'Calabar Municipal Recycling Hub', 'Murtala Mohammed Highway, Calabar', 4.975900, 8.341200, 'Unverified', '+234 803 000 0001', 'Community drop-off centre handling cables, chargers, printers and monitors. Call ahead for large appliances.', 1, NOW() - INTERVAL 195 DAY),
  (3, 'University of Calabar Eco Point', 'UNICAL campus, Calabar', 4.952900, 8.336700, 'Unverified', 'Environment Unit, UNICAL', 'Collection point serving the university community. Accepts student and staff electronics.', 1, NOW() - INTERVAL 190 DAY),
  (4, 'Marian Road Community Drop-off', 'Marian Road, Calabar', 4.969300, 8.331200, 'Unverified', '+234 803 000 0002', 'Neighbourhood collection point for small devices, batteries and accessories.', 1, NOW() - INTERVAL 150 DAY),
  (5, 'Calabar South Certified E-Waste Depot', 'Calabar South, Calabar', 4.962500, 8.327100, 'Certified', '+234 803 000 0003', 'Certified depot with weighing, dismantling and documentation. Batteries and CRT equipment accepted with prior notice.', 1, NOW() - INTERVAL 120 DAY),
  (6, 'Watt Market Battery Return Point', 'Watt Market, Calabar', 4.963100, 8.339300, 'Certified', '+234 803 000 0004', 'Battery and small-electronics return point inside the market. Short drop-off window, mornings preferred.', 1, NOW() - INTERVAL 90 DAY);

INSERT INTO articles (articleId, title, body, category, authorId, publishedAt) VALUES
  (1, 'Keep batteries out of household bins', 'Discarded batteries are one of the most common causes of fires in household and campus waste. Damaged cells can short-circuit, heat up and ignite surrounding material, and the metals inside them can leach into soil and groundwater.\n\nStore used batteries in a dry container with the terminals taped over, keep them away from heat, and take them to a collection point that accepts batteries. Never burn, puncture or dismantle a battery, and never store lithium cells loose in a bag of metal objects.', 'Awareness', 1, NOW() - INTERVAL 190 DAY),
  (2, 'Prepare a device for responsible recycling', 'A little preparation makes recycling faster and protects your own data.\n\nBack up anything you want to keep, sign out of every account, remove SIM and memory cards, then factory reset the device. Keep chargers and cables with the device where the centre accepts them, and remove any swollen or damaged battery separately so staff can handle it safely.', 'Awareness', 1, NOW() - INTERVAL 170 DAY),
  (3, 'What is actually inside e-waste', 'Electrical and electronic equipment contains a mixture of valuable metals such as copper, gold and aluminium alongside hazardous materials including lead, mercury, cadmium and brominated flame retardants.\n\nInformal burning and open dumping release those substances into air, soil and water. Correct collection does two things at once: it keeps toxins out of the environment and it returns recoverable metals, plastics and glass to the manufacturing chain.', 'Awareness', 1, NOW() - INTERVAL 140 DAY),
  (4, 'Data safety before you let a device go', 'Storage is not always erased by a simple delete. On phones and laptops, encryption plus a factory reset is the practical route; on older devices, repeated overwriting is more reliable.\n\nIf a device will not power on at all, remove or keep the storage component where possible, and tell the collection staff that the device still holds data.', 'Awareness', 1, NOW() - INTERVAL 95 DAY),
  (5, 'Extended producer responsibility in Nigeria', 'Nigeria manages electrical and electronic equipment through the National Environmental (Electrical/Electronic Sector) Regulations, supported by an extended producer responsibility approach in which producers and importers share responsibility for end-of-life equipment.\n\nIn practice this means registered collection and recycling channels, documented handover of equipment, and reporting of quantities handled. Confirm current requirements with NESREA and your institution before setting up a new collection arrangement.', 'Policy', 1, NOW() - INTERVAL 180 DAY),
  (6, 'Safe campus collection practice', 'Departments should store unwanted electronics in a dry, access-controlled area and record device types and approximate quantities as items arrive.\n\nTransfers should go to a qualified collection partner with a written record of what left the department and when. Equipment must not be dismantled in offices or classrooms, and batteries should be stored separately from other devices.', 'Policy', 1, NOW() - INTERVAL 150 DAY),
  (7, 'Reporting an e-waste concern on campus', 'Anyone on campus can raise an e-waste concern. Submit a report on this platform with the item type, an approximate quantity and the location, and attach a photograph where it helps.\n\nReports are reviewed by the platform administrator and moved from Pending to Reviewed and then Resolved as the material is collected. Repeated reports about the same pile are merged during review, so include the exact location in your description.', 'Policy', 1, NOW() - INTERVAL 60 DAY);
INSERT INTO ewaste_reports (reportId, userId, itemType, estimatedQuantity, campusLocation, photoPath, status, reportedAt, reviewedBy, reviewedAt) VALUES
  (1,  2, 'Laptop', '3 units', 'ICT Lab, Main Campus', NULL, 'Pending',  NOW() - INTERVAL 5 DAY,   NULL, NULL),
  (2,  3, 'Mobile phones', '8 units', 'Student Affairs block', NULL, 'Reviewed', NOW() - INTERVAL 12 DAY,  1, NOW() - INTERVAL 11 DAY),
  (3,  2, 'Printer', '1 unit', 'Faculty of Science', NULL, 'Resolved', NOW() - INTERVAL 35 DAY,  1, NOW() - INTERVAL 33 DAY),
  (4,  3, 'Batteries', 'Approx. 2 kg', 'Library', NULL, 'Pending',  NOW() - INTERVAL 8 DAY,   NULL, NULL),
  (5,  4, 'Monitors', '6 units', 'Business Annex, Marian Road', NULL, 'Reviewed', NOW() - INTERVAL 20 DAY,  1, NOW() - INTERVAL 18 DAY),
  (6,  2, 'Chargers and cables', 'Approx. 40 items', 'Female Hostel', NULL, 'Resolved', NOW() - INTERVAL 60 DAY,  1, NOW() - INTERVAL 58 DAY),
  (7,  3, 'Desktop computers', '4 units', 'Computer Science Department', NULL, 'Pending',  NOW() - INTERVAL 42 DAY,  NULL, NULL),
  (8,  4, 'Televisions', '2 units', 'Staff Quarters', NULL, 'Resolved', NOW() - INTERVAL 75 DAY,  1, NOW() - INTERVAL 72 DAY),
  (9,  2, 'Tablets', '5 units', 'Faculty of Education', NULL, 'Reviewed', NOW() - INTERVAL 95 DAY,  1, NOW() - INTERVAL 93 DAY),
  (10, 3, 'Batteries', '3 kg', 'Engineering Workshop', NULL, 'Resolved', NOW() - INTERVAL 110 DAY, 1, NOW() - INTERVAL 108 DAY),
  (11, 4, 'Refrigerators', '1 unit', 'Cafeteria', NULL, 'Pending',  NOW() - INTERVAL 130 DAY, NULL, NULL),
  (12, 2, 'Keyboards, mice and accessories', 'Approx. 25 items', 'ICT Lab, Main Campus', NULL, 'Resolved', NOW() - INTERVAL 145 DAY, 1, NOW() - INTERVAL 143 DAY),
  (13, 3, 'Mobile phones', '12 units', 'Security Post', NULL, 'Reviewed', NOW() - INTERVAL 160 DAY, 1, NOW() - INTERVAL 158 DAY),
  (14, 4, 'Printers and scanners', '3 units', 'Administrative Block', NULL, 'Resolved', NOW() - INTERVAL 175 DAY, 1, NOW() - INTERVAL 173 DAY);

INSERT INTO recycling_logs (logId, userId, centerId, itemType, quantity, loggedAt) VALUES
  (1,  2, 1, 'Mobile phone', '2 units', NOW() - INTERVAL 1 DAY),
  (2,  3, 2, 'Laptop', '1 unit', NOW() - INTERVAL 9 DAY),
  (3,  2, 3, 'Batteries', '1 kg', NOW() - INTERVAL 16 DAY),
  (4,  3, 1, 'Chargers and cables', '5 items', NOW() - INTERVAL 24 DAY),
  (5,  4, 5, 'Desktop computer', '2 units', NOW() - INTERVAL 31 DAY),
  (6,  2, 5, 'Printer', '1 unit', NOW() - INTERVAL 38 DAY),
  (7,  3, 4, 'Monitors', '2 units', NOW() - INTERVAL 45 DAY),
  (8,  4, 2, 'Televisions', '1 unit', NOW() - INTERVAL 52 DAY),
  (9,  2, 1, 'Tablet', '1 unit', NOW() - INTERVAL 59 DAY),
  (10, 3, 5, 'Batteries', '2.5 kg', NOW() - INTERVAL 66 DAY),
  (11, 4, 6, 'Chargers and cables', '8 items', NOW() - INTERVAL 73 DAY),
  (12, 2, 3, 'Laptop', '2 units', NOW() - INTERVAL 80 DAY),
  (13, 3, 2, 'Keyboard and mouse', '4 items', NOW() - INTERVAL 88 DAY),
  (14, 4, 5, 'Refrigerator', '1 unit', NOW() - INTERVAL 96 DAY),
  (15, 2, 4, 'Mobile phone', '3 units', NOW() - INTERVAL 104 DAY),
  (16, 3, 1, 'Printers and scanners', '1 unit', NOW() - INTERVAL 112 DAY),
  (17, 4, 3, 'Monitors', '3 units', NOW() - INTERVAL 120 DAY),
  (18, 2, 5, 'Desktop computer', '1 unit', NOW() - INTERVAL 128 DAY),
  (19, 3, 6, 'Batteries', '1.5 kg', NOW() - INTERVAL 136 DAY),
  (20, 4, 2, 'Televisions', '2 units', NOW() - INTERVAL 144 DAY),
  (21, 2, 1, 'Chargers and cables', '6 items', NOW() - INTERVAL 152 DAY),
  (22, 3, 5, 'Laptop', '1 unit', NOW() - INTERVAL 160 DAY),
  (23, 4, 4, 'Tablet', '2 units', NOW() - INTERVAL 168 DAY),
  (24, 2, 2, 'Mobile phone', '5 units', NOW() - INTERVAL 175 DAY);

INSERT INTO feedback (userId, logId, rating, message, submittedAt) VALUES
  (2, 1,  5, 'Easy drop-off and helpful staff.', NOW() - INTERVAL 1 DAY),
  (2, 3,  4, 'Clear directions and the batteries were accepted without fuss.', NOW() - INTERVAL 16 DAY),
  (4, 5,  5, 'Weighing was transparent and I got a receipt.', NOW() - INTERVAL 31 DAY),
  (2, 9,  3, 'Busy in the morning and I waited a while to be attended to.', NOW() - INTERVAL 59 DAY),
  (4, 14, 4, 'Booked ahead and it went smoothly.', NOW() - INTERVAL 96 DAY),
  (4, 20, 5, 'Staff explained what happens to the material afterwards.', NOW() - INTERVAL 144 DAY);

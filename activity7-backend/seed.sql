-- Same eight records as the Activity 6 frontend (js/data.js).
-- Inserts only when the table is empty, so it is safe to run more than once.
INSERT INTO records (title, category, description, status)
SELECT * FROM (VALUES
  ('Broken classroom light', 'Electrical', 'The light in Room B12 does not switch on.', 'Pending'),
  ('Leaking tap near cafeteria', 'Plumbing', 'The outside tap beside the cafeteria keeps leaking.', 'In progress'),
  ('Loose library desk', 'Furniture', 'One of the study desks on the first floor is unstable.', 'Pending'),
  ('Blocked washroom sink', 'Plumbing', 'Water is draining very slowly in the washroom near Block C.', 'Completed'),
  ('Damaged lecture room chair', 'Furniture', 'A chair in Lecture Room 4 has a broken leg.', 'Pending'),
  ('Corridor light flickering', 'Electrical', 'The corridor light outside Room A06 flickers continuously.', 'In progress'),
  ('Overflowing waste bin', 'Cleaning', 'The waste bin beside the student centre needs attention.', 'Completed'),
  ('Cracked classroom window', 'Building', 'There is a crack in the window of Room B08.', 'Pending')
) AS v(title, category, description, status)
WHERE NOT EXISTS (SELECT 1 FROM records);

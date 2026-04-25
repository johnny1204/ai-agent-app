-- Migration to add metadata columns to the questions table
ALTER TABLE questions ADD COLUMN exam_year INTEGER;
ALTER TABLE questions ADD COLUMN exam_season TEXT;
ALTER TABLE questions ADD COLUMN question_number INTEGER;

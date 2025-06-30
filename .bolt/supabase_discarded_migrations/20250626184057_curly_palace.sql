/*
  # Add Comprehensive Topics for All Subjects

  1. New Topics
    - Mathematics (15+ topics per grade)
    - Life Sciences (15+ topics)
    - English Home Language (15+ topics)
    - Physical Sciences (15+ topics)
    - Business Studies (15+ topics)
    - History (15+ topics)
    - Geography (15+ topics)
    - Afrikaans First Additional Language (15+ topics)
    - Life Orientation (15+ topics)
    - Natural Sciences (15+ topics for Grades 8-9)
    - Mathematical Literacy (15+ topics)

  2. Features
    - Each topic has engaging names and descriptions
    - Proper positioning for map layout
    - Realistic progression from basic to advanced
    - Grade-appropriate content
*/

-- Clear existing topics to avoid conflicts
DELETE FROM topics;

-- Mathematics Topics
DO $$
DECLARE
  math_id uuid;
BEGIN
  SELECT id INTO math_id FROM subjects WHERE name = 'Mathematics';
  
  IF FOUND THEN
    INSERT INTO topics (subject_id, title, name, description, status, position_x, position_y, subtopic_key)
    VALUES
      -- Grade 8-9 Level Topics
      (math_id, 'Number Systems', 'Number Kingdom', 'Master integers, rational numbers, and number operations', 'not_started', 120, 150, 'number-systems'),
      (math_id, 'Algebraic Expressions', 'Algebra Academy', 'Learn to work with variables and algebraic expressions', 'locked', 280, 200, 'algebraic-expressions'),
      (math_id, 'Linear Equations', 'Equation Empire', 'Solve linear equations and inequalities', 'locked', 180, 300, 'linear-equations'),
      (math_id, 'Geometry Basics', 'Shape Sanctuary', 'Explore angles, triangles, and geometric properties', 'locked', 320, 250, 'geometry-basics'),
      (math_id, 'Coordinate Geometry', 'Graph Galaxy', 'Plot points and work with coordinate systems', 'locked', 150, 400, 'coordinate-geometry'),
      (math_id, 'Data Handling', 'Statistics Station', 'Collect, organize, and interpret data', 'locked', 350, 350, 'data-handling'),
      (math_id, 'Measurement', 'Measure Mountain', 'Work with perimeter, area, and volume', 'locked', 220, 450, 'measurement'),
      (math_id, 'Patterns & Sequences', 'Pattern Palace', 'Discover number patterns and sequences', 'locked', 380, 180, 'patterns-sequences'),
      
      -- Grade 10-12 Level Topics
      (math_id, 'Functions', 'Function Factory', 'Understand and work with mathematical functions', 'locked', 120, 550, 'functions'),
      (math_id, 'Quadratic Functions', 'Quadratic Quest', 'Master parabolas and quadratic equations', 'locked', 280, 500, 'quadratic-functions'),
      (math_id, 'Exponential Functions', 'Exponential Expedition', 'Explore exponential growth and decay', 'locked', 200, 600, 'exponential-functions'),
      (math_id, 'Trigonometry', 'Triangle Temple', 'Discover sine, cosine, and tangent', 'locked', 350, 480, 'trigonometry'),
      (math_id, 'Analytical Geometry', 'Coordinate Castle', 'Advanced coordinate geometry and circles', 'locked', 150, 700, 'analytical-geometry'),
      (math_id, 'Calculus Introduction', 'Calculus Citadel', 'Introduction to limits and derivatives', 'locked', 320, 580, 'calculus-intro'),
      (math_id, 'Statistics & Probability', 'Probability Plaza', 'Advanced statistics and probability theory', 'locked', 250, 750, 'statistics-probability'),
      (math_id, 'Financial Mathematics', 'Finance Fortress', 'Interest, loans, and financial calculations', 'locked', 380, 650, 'financial-mathematics')
    ON CONFLICT (subtopic_key) DO NOTHING;
  END IF;
END $$;

-- Mathematical Literacy Topics
DO $$
DECLARE
  mathlit_id uuid;
BEGIN
  SELECT id INTO mathlit_id FROM subjects WHERE name = 'Mathematical Literacy';
  
  IF FOUND THEN
    INSERT INTO topics (subject_id, title, name, description, status, position_x, position_y, subtopic_key)
    VALUES
      (mathlit_id, 'Basic Calculations', 'Calculator Central', 'Master basic arithmetic and calculator use', 'not_started', 120, 150, 'basic-calculations'),
      (mathlit_id, 'Measurement Units', 'Measurement Manor', 'Work with different units and conversions', 'locked', 250, 200, 'measurement-units'),
      (mathlit_id, 'Scale & Maps', 'Scale Station', 'Understand scale, maps, and proportions', 'locked', 180, 300, 'scale-maps'),
      (mathlit_id, 'Data Analysis', 'Data Detective', 'Interpret graphs, charts, and tables', 'locked', 320, 250, 'data-analysis'),
      (mathlit_id, 'Finance Basics', 'Money Matters', 'Personal finance and budgeting', 'locked', 150, 400, 'finance-basics'),
      (mathlit_id, 'Probability in Life', 'Chance Chamber', 'Real-world probability applications', 'locked', 280, 350, 'probability-life'),
      (mathlit_id, 'Geometry in Practice', 'Shape Solutions', 'Practical geometry for everyday use', 'locked', 220, 450, 'geometry-practice'),
      (mathlit_id, 'Interest & Loans', 'Interest Island', 'Understanding loans, credit, and interest', 'locked', 350, 380, 'interest-loans'),
      (mathlit_id, 'Tax & Deductions', 'Tax Territory', 'Income tax and deductions', 'locked', 180, 550, 'tax-deductions'),
      (mathlit_id, 'Insurance & Risk', 'Risk Ridge', 'Insurance principles and risk assessment', 'locked', 300, 500, 'insurance-risk'),
      (mathlit_id, 'Investment Basics', 'Investment Inn', 'Basic investment concepts', 'locked', 240, 600, 'investment-basics'),
      (mathlit_id, 'Business Calculations', 'Business Bay', 'Profit, loss, and business mathematics', 'locked', 380, 480, 'business-calculations'),
      (mathlit_id, 'Consumer Studies', 'Consumer Corner', 'Smart shopping and consumer rights', 'locked', 160, 650, 'consumer-studies'),
      (mathlit_id, 'Travel Mathematics', 'Travel Town', 'Distance, time, and travel calculations', 'locked', 320, 580, 'travel-mathematics'),
      (mathlit_id, 'Health Statistics', 'Health Hub', 'Medical and health-related statistics', 'locked', 280, 700, 'health-statistics')
    ON CONFLICT (subtopic_key) DO NOTHING;
  END IF;
END $$;

-- Life Sciences Topics
DO $$
DECLARE
  bio_id uuid;
BEGIN
  SELECT id INTO bio_id FROM subjects WHERE name = 'Life Sciences';
  
  IF FOUND THEN
    INSERT INTO topics (subject_id, title, name, description, status, position_x, position_y, subtopic_key)
    VALUES
      (bio_id, 'Cell Biology', 'Cell City', 'Explore the building blocks of life', 'not_started', 150, 180, 'cell-biology'),
      (bio_id, 'Photosynthesis', 'Green Gardens', 'How plants make food from sunlight', 'locked', 280, 220, 'photosynthesis'),
      (bio_id, 'Cellular Respiration', 'Energy Engine', 'How cells release energy from food', 'locked', 200, 320, 'cellular-respiration'),
      (bio_id, 'Human Body Systems', 'Body Boulevard', 'Explore organ systems and their functions', 'locked', 350, 280, 'human-body-systems'),
      (bio_id, 'Genetics & Heredity', 'DNA District', 'Inheritance and genetic variation', 'locked', 180, 420, 'genetics-heredity'),
      (bio_id, 'Evolution', 'Evolution Avenue', 'How species change over time', 'locked', 320, 380, 'evolution'),
      (bio_id, 'Ecology', 'Ecosystem Estate', 'Interactions between organisms and environment', 'locked', 250, 480, 'ecology'),
      (bio_id, 'Biodiversity', 'Diversity Drive', 'The variety of life on Earth', 'locked', 380, 320, 'biodiversity'),
      (bio_id, 'Plant Biology', 'Plant Paradise', 'Structure and function of plants', 'locked', 160, 550, 'plant-biology'),
      (bio_id, 'Animal Biology', 'Animal Arena', 'Animal behavior and adaptations', 'locked', 300, 520, 'animal-biology'),
      (bio_id, 'Microbiology', 'Microbe Metropolis', 'The world of bacteria and viruses', 'locked', 220, 600, 'microbiology'),
      (bio_id, 'Human Health', 'Health Harbor', 'Disease, immunity, and wellness', 'locked', 350, 450, 'human-health'),
      (bio_id, 'Biotechnology', 'Biotech Base', 'Applications of biology in technology', 'locked', 280, 650, 'biotechnology'),
      (bio_id, 'Environmental Issues', 'Environment Edge', 'Conservation and environmental challenges', 'locked', 180, 700, 'environmental-issues'),
      (bio_id, 'Molecular Biology', 'Molecule Manor', 'DNA, RNA, and protein synthesis', 'locked', 320, 580, 'molecular-biology'),
      (bio_id, 'Reproduction', 'Reproduction Ridge', 'How organisms reproduce and develop', 'locked', 240, 750, 'reproduction')
    ON CONFLICT (subtopic_key) DO NOTHING;
  END IF;
END $$;

-- Natural Sciences Topics (Grades 8-9)
DO $$
DECLARE
  natscience_id uuid;
BEGIN
  SELECT id INTO natscience_id FROM subjects WHERE name = 'Natural Sciences';
  
  IF FOUND THEN
    INSERT INTO topics (subject_id, title, name, description, status, position_x, position_y, subtopic_key)
    VALUES
      (natscience_id, 'Matter & Materials', 'Matter Mountain', 'Properties and classification of matter', 'not_started', 150, 180, 'matter-materials'),
      (natscience_id, 'Atoms & Elements', 'Atomic Arcade', 'Building blocks of all matter', 'locked', 280, 220, 'atoms-elements'),
      (natscience_id, 'Chemical Reactions', 'Reaction Ridge', 'How substances change and combine', 'locked', 200, 320, 'chemical-reactions'),
      (natscience_id, 'Forces & Motion', 'Force Field', 'How objects move and interact', 'locked', 350, 280, 'forces-motion'),
      (natscience_id, 'Energy & Change', 'Energy Empire', 'Different forms of energy and transfers', 'locked', 180, 420, 'energy-change'),
      (natscience_id, 'Sound & Light', 'Wave World', 'Properties of sound and light waves', 'locked', 320, 380, 'sound-light'),
      (natscience_id, 'Electricity & Magnetism', 'Electric Estate', 'Principles of electricity and magnetism', 'locked', 250, 480, 'electricity-magnetism'),
      (natscience_id, 'Earth & Beyond', 'Planet Plaza', 'Earth, solar system, and space', 'locked', 380, 320, 'earth-beyond'),
      (natscience_id, 'Life Processes', 'Life Lane', 'Basic processes in living organisms', 'locked', 160, 550, 'life-processes'),
      (natscience_id, 'Ecosystems', 'Eco Enclave', 'Interactions in natural systems', 'locked', 300, 520, 'ecosystems'),
      (natscience_id, 'Human Body', 'Body Boulevard', 'Systems and functions of the human body', 'locked', 220, 600, 'human-body'),
      (natscience_id, 'Adaptations', 'Adaptation Alley', 'How organisms adapt to environments', 'locked', 350, 450, 'adaptations'),
      (natscience_id, 'Microorganisms', 'Microbe Maze', 'Bacteria, viruses, and fungi', 'locked', 280, 650, 'microorganisms'),
      (natscience_id, 'Acids & Bases', 'pH Palace', 'Properties of acids and bases', 'locked', 180, 700, 'acids-bases'),
      (natscience_id, 'Simple Machines', 'Machine Mansion', 'Levers, pulleys, and mechanical advantage', 'locked', 320, 580, 'simple-machines')
    ON CONFLICT (subtopic_key) DO NOTHING;
  END IF;
END $$;

-- English Home Language Topics
DO $$
DECLARE
  english_id uuid;
BEGIN
  SELECT id INTO english_id FROM subjects WHERE name = 'English Home Language';
  
  IF FOUND THEN
    INSERT INTO topics (subject_id, title, name, description, status, position_x, position_y, subtopic_key)
    VALUES
      (english_id, 'Grammar Fundamentals', 'Grammar Grove', 'Master the building blocks of language', 'not_started', 150, 180, 'grammar-fundamentals'),
      (english_id, 'Comprehension Skills', 'Comprehension Castle', 'Develop critical reading and understanding', 'locked', 280, 220, 'comprehension-skills'),
      (english_id, 'Poetry Analysis', 'Poetry Palace', 'Explore the beauty and meaning in poems', 'locked', 200, 320, 'poetry-analysis'),
      (english_id, 'Novel Study', 'Novel Nook', 'Analyze themes and characters in novels', 'locked', 350, 280, 'novel-study'),
      (english_id, 'Short Stories', 'Story Square', 'Explore elements of short fiction', 'locked', 180, 420, 'short-stories'),
      (english_id, 'Essay Writing', 'Essay Estate', 'Craft compelling argumentative essays', 'locked', 320, 380, 'essay-writing'),
      (english_id, 'Creative Writing', 'Creative Corner', 'Express yourself through imaginative writing', 'locked', 250, 480, 'creative-writing'),
      (english_id, 'Drama & Plays', 'Drama District', 'Study dramatic works and theatrical elements', 'locked', 380, 320, 'drama-plays'),
      (english_id, 'Visual Literacy', 'Visual Valley', 'Interpret images, cartoons, and advertisements', 'locked', 160, 550, 'visual-literacy'),
      (english_id, 'Oral Presentation', 'Speech Summit', 'Develop confident public speaking skills', 'locked', 300, 520, 'oral-presentation'),
      (english_id, 'Language Structures', 'Language Labyrinth', 'Advanced grammar and language usage', 'locked', 220, 600, 'language-structures'),
      (english_id, 'Media Studies', 'Media Metropolis', 'Analyze various forms of media', 'locked', 350, 450, 'media-studies'),
      (english_id, 'Research Skills', 'Research Realm', 'Conduct effective research and cite sources', 'locked', 280, 650, 'research-skills'),
      (english_id, 'Shakespeare', 'Shakespeare Square', 'Study the works of William Shakespeare', 'locked', 180, 700, 'shakespeare'),
      (english_id, 'Literary Criticism', 'Critics Corner', 'Apply literary theories to texts', 'locked', 320, 580, 'literary-criticism'),
      (english_id, 'Film Study', 'Film Forum', 'Analyze cinematic techniques and themes', 'locked', 240, 750, 'film-study')
    ON CONFLICT (subtopic_key) DO NOTHING;
  END IF;
END $$;

-- Physical Sciences Topics
DO $$
DECLARE
  physics_id uuid;
BEGIN
  SELECT id INTO physics_id FROM subjects WHERE name = 'Physical Sciences';
  
  IF FOUND THEN
    INSERT INTO topics (subject_id, title, name, description, status, position_x, position_y, subtopic_key)
    VALUES
      (physics_id, 'Mechanics', 'Motion Metropolis', 'Study of forces and motion', 'not_started', 150, 180, 'mechanics'),
      (physics_id, 'Waves', 'Wave World', 'Properties and behavior of waves', 'locked', 280, 220, 'waves'),
      (physics_id, 'Electricity', 'Electric Empire', 'Electric circuits and current', 'locked', 200, 320, 'electricity'),
      (physics_id, 'Magnetism', 'Magnetic Mountain', 'Magnetic fields and electromagnetism', 'locked', 350, 280, 'magnetism'),
      (physics_id, 'Matter & Materials', 'Matter Manor', 'Properties and structure of matter', 'locked', 180, 420, 'matter-materials-physics'),
      (physics_id, 'Chemical Change', 'Chemical Castle', 'Chemical reactions and equations', 'locked', 320, 380, 'chemical-change'),
      (physics_id, 'Atomic Structure', 'Atom Arena', 'Structure of atoms and periodic table', 'locked', 250, 480, 'atomic-structure'),
      (physics_id, 'Chemical Systems', 'Systems Square', 'Industrial chemical processes', 'locked', 380, 320, 'chemical-systems'),
      (physics_id, 'Energy & Change', 'Energy Estate', 'Energy transformations and conservation', 'locked', 160, 550, 'energy-change-physics'),
      (physics_id, 'Organic Chemistry', 'Carbon City', 'Study of carbon compounds', 'locked', 300, 520, 'organic-chemistry'),
      (physics_id, 'Acids & Bases', 'pH Palace', 'Properties of acids and bases', 'locked', 220, 600, 'acids-bases-physics'),
      (physics_id, 'Electrochemistry', 'Electron Empire', 'Chemical reactions involving electricity', 'locked', 350, 450, 'electrochemistry'),
      (physics_id, 'Thermodynamics', 'Thermal Territory', 'Heat, temperature, and energy transfer', 'locked', 280, 650, 'thermodynamics'),
      (physics_id, 'Optical Phenomena', 'Optics Oasis', 'Light, lenses, and optical devices', 'locked', 180, 700, 'optical-phenomena'),
      (physics_id, 'Modern Physics', 'Quantum Quest', 'Introduction to quantum and nuclear physics', 'locked', 320, 580, 'modern-physics')
    ON CONFLICT (subtopic_key) DO NOTHING;
  END IF;
END $$;

-- Afrikaans First Additional Language Topics
DO $$
DECLARE
  afrikaans_id uuid;
BEGIN
  SELECT id INTO afrikaans_id FROM subjects WHERE name = 'Afrikaans First Additional Language';
  
  IF FOUND THEN
    INSERT INTO topics (subject_id, title, name, description, status, position_x, position_y, subtopic_key)
    VALUES
      (afrikaans_id, 'Basic Vocabulary', 'Woordeskat Wêreld', 'Essential Afrikaans words and phrases', 'not_started', 150, 180, 'basic-vocabulary'),
      (afrikaans_id, 'Grammar Basics', 'Grammatika Grond', 'Fundamental Afrikaans grammar rules', 'locked', 280, 220, 'grammar-basics-afrikaans'),
      (afrikaans_id, 'Reading Comprehension', 'Lees Landskap', 'Understanding written Afrikaans texts', 'locked', 200, 320, 'reading-comprehension-afrikaans'),
      (afrikaans_id, 'Listening Skills', 'Luister Laan', 'Developing Afrikaans listening abilities', 'locked', 350, 280, 'listening-skills'),
      (afrikaans_id, 'Speaking Practice', 'Praat Plein', 'Conversational Afrikaans practice', 'locked', 180, 420, 'speaking-practice'),
      (afrikaans_id, 'Writing Skills', 'Skryf Sentrum', 'Developing written Afrikaans abilities', 'locked', 320, 380, 'writing-skills-afrikaans'),
      (afrikaans_id, 'Literature Study', 'Literatuur Land', 'Exploring Afrikaans literary works', 'locked', 250, 480, 'literature-study-afrikaans'),
      (afrikaans_id, 'Poetry', 'Poësie Pad', 'Afrikaans poetry analysis and appreciation', 'locked', 380, 320, 'poetry-afrikaans'),
      (afrikaans_id, 'Cultural Context', 'Kultuur Kasteel', 'Understanding Afrikaans culture and context', 'locked', 160, 550, 'cultural-context'),
      (afrikaans_id, 'Idiomatic Expressions', 'Idioom Eiland', 'Common Afrikaans idioms and expressions', 'locked', 300, 520, 'idiomatic-expressions'),
      (afrikaans_id, 'Oral Presentations', 'Mondeling Metropool', 'Preparing and delivering Afrikaans speeches', 'locked', 220, 600, 'oral-presentations-afrikaans'),
      (afrikaans_id, 'Media Literacy', 'Media Middelpunt', 'Understanding Afrikaans media', 'locked', 350, 450, 'media-literacy-afrikaans'),
      (afrikaans_id, 'Creative Writing', 'Kreatiewe Kamer', 'Imaginative writing in Afrikaans', 'locked', 280, 650, 'creative-writing-afrikaans'),
      (afrikaans_id, 'Formal Communication', 'Formele Forum', 'Business and formal Afrikaans', 'locked', 180, 700, 'formal-communication'),
      (afrikaans_id, 'Translation Skills', 'Vertaling Vallei', 'Translating between English and Afrikaans', 'locked', 320, 580, 'translation-skills')
    ON CONFLICT (subtopic_key) DO NOTHING;
  END IF;
END $$;

-- Life Orientation Topics
DO $$
DECLARE
  lo_id uuid;
BEGIN
  SELECT id INTO lo_id FROM subjects WHERE name = 'Life Orientation';
  
  IF FOUND THEN
    INSERT INTO topics (subject_id, title, name, description, status, position_x, position_y, subtopic_key)
    VALUES
      (lo_id, 'Personal Development', 'Self-Discovery Sanctuary', 'Understanding yourself and personal growth', 'not_started', 150, 180, 'personal-development'),
      (lo_id, 'Social Development', 'Community Commons', 'Building healthy relationships and social skills', 'locked', 280, 220, 'social-development'),
      (lo_id, 'Physical Education', 'Fitness Frontier', 'Physical fitness and healthy lifestyle', 'locked', 200, 320, 'physical-education'),
      (lo_id, 'Health Promotion', 'Wellness Way', 'Making informed health choices', 'locked', 350, 280, 'health-promotion'),
      (lo_id, 'Career Guidance', 'Career Crossroads', 'Exploring career paths and opportunities', 'locked', 180, 420, 'career-guidance'),
      (lo_id, 'Study Skills', 'Study Station', 'Effective learning and study techniques', 'locked', 320, 380, 'study-skills'),
      (lo_id, 'Human Rights', 'Rights Realm', 'Understanding and respecting human rights', 'locked', 250, 480, 'human-rights'),
      (lo_id, 'Democracy & Citizenship', 'Citizen City', 'Being an active and responsible citizen', 'locked', 380, 320, 'democracy-citizenship'),
      (lo_id, 'Environmental Awareness', 'Eco Enclave', 'Caring for our environment', 'locked', 160, 550, 'environmental-awareness'),
      (lo_id, 'Goal Setting', 'Goal Gateway', 'Setting and achieving personal goals', 'locked', 300, 520, 'goal-setting'),
      (lo_id, 'Stress Management', 'Calm Corner', 'Coping with stress and pressure', 'locked', 220, 600, 'stress-management'),
      (lo_id, 'Decision Making', 'Decision Domain', 'Making responsible life choices', 'locked', 350, 450, 'decision-making'),
      (lo_id, 'Financial Literacy', 'Finance Frontier', 'Managing personal finances', 'locked', 280, 650, 'financial-literacy'),
      (lo_id, 'Diversity & Inclusion', 'Diversity District', 'Embracing differences and promoting inclusion', 'locked', 180, 700, 'diversity-inclusion'),
      (lo_id, 'Leadership Skills', 'Leadership Lane', 'Developing leadership abilities', 'locked', 320, 580, 'leadership-skills')
    ON CONFLICT (subtopic_key) DO NOTHING;
  END IF;
END $$;

-- Business Studies Topics
DO $$
DECLARE
  business_id uuid;
BEGIN
  SELECT id INTO business_id FROM subjects WHERE name = 'Business Studies';
  
  IF FOUND THEN
    INSERT INTO topics (subject_id, title, name, description, status, position_x, position_y, subtopic_key)
    VALUES
      (business_id, 'Business Environments', 'Market Metropolis', 'Understanding business contexts and environments', 'not_started', 150, 180, 'business-environments'),
      (business_id, 'Entrepreneurship', 'Entrepreneur Estate', 'Developing entrepreneurial skills and mindset', 'locked', 280, 220, 'entrepreneurship'),
      (business_id, 'Business Roles', 'Role Realm', 'Understanding different roles in business', 'locked', 200, 320, 'business-roles'),
      (business_id, 'Business Operations', 'Operations Oasis', 'Managing business processes and functions', 'locked', 350, 280, 'business-operations'),
      (business_id, 'Marketing', 'Marketing Manor', 'Promoting products and services', 'locked', 180, 420, 'marketing'),
      (business_id, 'Human Resources', 'HR Harbor', 'Managing people in organizations', 'locked', 320, 380, 'human-resources'),
      (business_id, 'Financial Management', 'Finance Fortress', 'Managing business finances', 'locked', 250, 480, 'financial-management'),
      (business_id, 'Business Strategies', 'Strategy Summit', 'Planning for business success', 'locked', 380, 320, 'business-strategies'),
      (business_id, 'Corporate Social Responsibility', 'CSR City', 'Business ethics and social responsibility', 'locked', 160, 550, 'corporate-social-responsibility'),
      (business_id, 'Quality Management', 'Quality Quarter', 'Ensuring business excellence', 'locked', 300, 520, 'quality-management'),
      (business_id, 'Team Dynamics', 'Team Territory', 'Working effectively in business teams', 'locked', 220, 600, 'team-dynamics'),
      (business_id, 'Business Communication', 'Communication Court', 'Effective business communication', 'locked', 350, 450, 'business-communication'),
      (business_id, 'Business Ventures', 'Venture Valley', 'Starting and growing business ventures', 'locked', 280, 650, 'business-ventures'),
      (business_id, 'Investment & Insurance', 'Investment Isle', 'Business investment and risk management', 'locked', 180, 700, 'investment-insurance'),
      (business_id, 'Presentation Skills', 'Presentation Plaza', 'Effective business presentations', 'locked', 320, 580, 'presentation-skills')
    ON CONFLICT (subtopic_key) DO NOTHING;
  END IF;
END $$;

-- History Topics
DO $$
DECLARE
  history_id uuid;
BEGIN
  SELECT id INTO history_id FROM subjects WHERE name = 'History';
  
  IF FOUND THEN
    INSERT INTO topics (subject_id, title, name, description, status, position_x, position_y, subtopic_key)
    VALUES
      (history_id, 'Industrial Revolution', 'Industry Isle', 'The transformation of manufacturing and society', 'not_started', 150, 180, 'industrial-revolution'),
      (history_id, 'French Revolution', 'Revolution Ridge', 'Liberty, equality, and fraternity in France', 'locked', 280, 220, 'french-revolution'),
      (history_id, 'Colonialism in Africa', 'Colonial Crossroads', 'European colonization of Africa', 'locked', 200, 320, 'colonialism-africa'),
      (history_id, 'South African History', 'Heritage Harbor', 'Key events in South African history', 'locked', 350, 280, 'south-african-history'),
      (history_id, 'World War I', 'Great War Grounds', 'Causes and consequences of the First World War', 'locked', 180, 420, 'world-war-i'),
      (history_id, 'World War II', 'Global Conflict Gulf', 'The Second World War and its impact', 'locked', 320, 380, 'world-war-ii'),
      (history_id, 'Cold War', 'Cold War Canyon', 'Tension between superpowers after WWII', 'locked', 250, 480, 'cold-war'),
      (history_id, 'Apartheid', 'Apartheid Avenue', 'South Africa's system of racial segregation', 'locked', 380, 320, 'apartheid'),
      (history_id, 'Civil Rights Movement', 'Rights Rally', 'The struggle for equal rights', 'locked', 160, 550, 'civil-rights-movement'),
      (history_id, 'Ancient Civilizations', 'Ancient Acropolis', 'Early human societies and cultures', 'locked', 300, 520, 'ancient-civilizations'),
      (history_id, 'Middle Ages', 'Medieval Meadow', 'European history from 5th to 15th century', 'locked', 220, 600, 'middle-ages'),
      (history_id, 'Renaissance', 'Renaissance Realm', 'The rebirth of art and learning in Europe', 'locked', 350, 450, 'renaissance'),
      (history_id, 'Decolonization', 'Freedom Frontier', 'Independence movements in former colonies', 'locked', 280, 650, 'decolonization'),
      (history_id, 'Globalization', 'Global Gateway', 'The interconnection of the world', 'locked', 180, 700, 'globalization'),
      (history_id, 'Modern Conflicts', 'Conflict Corner', 'Contemporary wars and international tensions', 'locked', 320, 580, 'modern-conflicts')
    ON CONFLICT (subtopic_key) DO NOTHING;
  END IF;
END $$;

-- Geography Topics
DO $$
DECLARE
  geography_id uuid;
BEGIN
  SELECT id INTO geography_id FROM subjects WHERE name = 'Geography';
  
  IF FOUND THEN
    INSERT INTO topics (subject_id, title, name, description, status, position_x, position_y, subtopic_key)
    VALUES
      (geography_id, 'Map Skills', 'Map Mansion', 'Reading and interpreting maps', 'not_started', 150, 180, 'map-skills'),
      (geography_id, 'Climate & Weather', 'Weather Watch', 'Understanding atmospheric conditions', 'locked', 280, 220, 'climate-weather'),
      (geography_id, 'Landforms', 'Landform Land', 'Physical features of the Earth's surface', 'locked', 200, 320, 'landforms'),
      (geography_id, 'Population Geography', 'Population Plaza', 'Human population patterns and trends', 'locked', 350, 280, 'population-geography'),
      (geography_id, 'Settlement Geography', 'Settlement Square', 'Human settlements and urbanization', 'locked', 180, 420, 'settlement-geography'),
      (geography_id, 'Economic Geography', 'Economy Empire', 'Economic activities and development', 'locked', 320, 380, 'economic-geography'),
      (geography_id, 'Water Resources', 'Water World', 'Management and conservation of water', 'locked', 250, 480, 'water-resources'),
      (geography_id, 'Geomorphology', 'Landform Labyrinth', 'Processes that shape the Earth's surface', 'locked', 380, 320, 'geomorphology'),
      (geography_id, 'Development Geography', 'Development Domain', 'Global development patterns and issues', 'locked', 160, 550, 'development-geography'),
      (geography_id, 'Resource Management', 'Resource Realm', 'Sustainable use of natural resources', 'locked', 300, 520, 'resource-management'),
      (geography_id, 'Environmental Issues', 'Eco Enclave', 'Human impact on the environment', 'locked', 220, 600, 'environmental-issues-geography'),
      (geography_id, 'GIS & Remote Sensing', 'Tech Territory', 'Geographic Information Systems', 'locked', 350, 450, 'gis-remote-sensing'),
      (geography_id, 'Climate Change', 'Climate Citadel', 'Causes and impacts of global warming', 'locked', 280, 650, 'climate-change'),
      (geography_id, 'Natural Hazards', 'Hazard Haven', 'Earthquakes, volcanoes, and other hazards', 'locked', 180, 700, 'natural-hazards'),
      (geography_id, 'Rural Geography', 'Rural Region', 'Life and challenges in rural areas', 'locked', 320, 580, 'rural-geography')
    ON CONFLICT (subtopic_key) DO NOTHING;
  END IF;
END $$;

-- Update subject colors for better visualization
UPDATE subjects SET color = '#8B5CF6' WHERE name = 'Mathematics';
UPDATE subjects SET color = '#7C3AED' WHERE name = 'Mathematical Literacy';
UPDATE subjects SET color = '#10B981' WHERE name = 'Life Sciences';
UPDATE subjects SET color = '#10B981' WHERE name = 'Natural Sciences';
UPDATE subjects SET color = '#3B82F6' WHERE name = 'English Home Language';
UPDATE subjects SET color = '#F59E0B' WHERE name = 'Physical Sciences';
UPDATE subjects SET color = '#F59E0B' WHERE name = 'Afrikaans First Additional Language';
UPDATE subjects SET color = '#059669' WHERE name = 'Business Studies';
UPDATE subjects SET color = '#DC2626' WHERE name = 'Life Orientation';
UPDATE subjects SET color = '#059669' WHERE name = 'Geography';
UPDATE subjects SET color = '#6366F1' WHERE name = 'History';
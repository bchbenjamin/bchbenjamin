-- Separate résumé inclusion from public-site publication. Default to exclusion for safety;
-- the owner workspace explicitly opts verified records in.
ALTER TABLE projects ADD COLUMN resume_included BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE experience ADD COLUMN resume_included BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE education ADD COLUMN resume_included BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE skills ADD COLUMN resume_included BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE achievements ADD COLUMN resume_included BOOLEAN NOT NULL DEFAULT FALSE;

-- Replace the inaccurate starter records with the current résumé-backed dataset.
-- Remove old relationships to those starter records; media files themselves remain in the
-- private media library until the owner chooses to remove them.
DELETE FROM media_relationships WHERE resource_type IN ('project', 'experience', 'education', 'achievement', 'profile');
DELETE FROM skills;
DELETE FROM skill_groups;
DELETE FROM experience;
DELETE FROM projects;
DELETE FROM education;
DELETE FROM achievements;

-- Canonical profile fields from the current résumé (no birth date or confidential role).
UPDATE profile
SET full_name = 'B C H Benjamin',
    headline = '5th-semester B.E. Computer Science student · Batch of 2028',
    summary = '5th-semester B.E. Computer Science student (Batch of 2028) with a strong foundation in Python Development, Data Engineering and Technical Research. At FOSSEE, IIT Bombay, developed Python automation and Blender/OpenFOAM tooling, contributed to open-source software and prepared technical documentation. Interested in AI/ML solutions, technical research, automation and data-driven software engineering.',
    location = 'Bengaluru, India',
    email = 'bchbenjamin@gmail.com',
    website_url = 'https://bchbenjamin.in',
    github_url = 'https://github.com/bchbenjamin',
    linkedin_url = 'https://linkedin.com/in/bchbenjamin',
    published = TRUE,
    public_fields = '{"fullName":true,"headline":true,"summary":true,"location":true,"email":true,"websiteUrl":true,"githubUrl":true,"linkedinUrl":true}'::jsonb,
    updated_at = now();

-- Seven résumé-listed projects. The visual and stack metadata is editable custom content.
INSERT INTO projects
(slug, name, tagline, summary, description, short_description, resume_description, role, status,
 repository_url, live_url, featured, published, resume_included, sort_order, custom_fields, public_fields)
VALUES
('ease-health', 'Ease Health — Patient Care Management', 'INFOSYS SPRINGBOARD · PERSONAL',
 'An AI-integrated healthcare management platform with patient, doctor and administrator portals.',
 'AI-integrated healthcare management platform with patient, doctor, and administrator portals. Built with FastAPI, Jinja2 and MySQL/TiDB, with bcrypt authentication, natural-language appointment booking using Groq/LLaMA 3, and healthcare scheduling workflows.',
 'AI-integrated healthcare management platform with patient, doctor and administrator portals.',
 'AI-integrated healthcare management platform with patient, doctor, and administrator portals. Built with FastAPI, Jinja2 and MySQL/TiDB, with bcrypt authentication, natural-language appointment booking using Groq/LLaMA 3, and healthcare scheduling workflows.',
 NULL, 'SELECTED WORK', 'https://github.com/bchbenjamin/Integrated-Patient-Care-Management-System', NULL,
 TRUE, TRUE, TRUE, 10,
 '{"stack":["FastAPI","Jinja2","MySQL / TiDB","Groq / LLaMA 3","bcrypt"],"visual":"siddhi","displayPeriod":"2026"}'::jsonb,
 '{"slug":true,"name":true,"tagline":true,"summary":true,"description":true,"status":true,"repositoryUrl":true,"liveUrl":true,"featured":true,"customFields.stack":true,"customFields.visual":true,"customFields.displayPeriod":true}'::jsonb),
('bengaluruduru', 'BengaluruDuru', 'AI CIVIC GOVERNANCE PLATFORM · PERSONAL',
 'An AI-powered civic issue reporting platform for structured reporting, routing and resolution verification.',
 'AI-powered civic issue reporting platform using Gemini 2.5 Flash. Implements structured issue extraction, automated categorization and routing, geographic duplicate detection, AI-assisted resolution verification, multilingual support, and map-based reporting.',
 'An AI-powered civic issue reporting platform for structured reporting, routing and resolution verification.',
 'AI-powered civic issue reporting platform using Gemini 2.5 Flash. Implements structured issue extraction, automated categorization and routing, geographic duplicate detection, AI-assisted resolution verification, multilingual support, and map-based reporting.',
 NULL, 'SELECTED WORK', 'https://github.com/bchbenjamin/bfb.2.2', NULL,
 TRUE, TRUE, TRUE, 20,
 '{"stack":["Gemini 2.5 Flash","Issue extraction","Geographic duplicate detection","Multilingual support","Map-based reporting"],"visual":"aiida","displayPeriod":"Mar 2026"}'::jsonb,
 '{"slug":true,"name":true,"tagline":true,"summary":true,"description":true,"status":true,"repositoryUrl":true,"liveUrl":true,"featured":true,"customFields.stack":true,"customFields.visual":true,"customFields.displayPeriod":true}'::jsonb),
('street-safety-device', 'AI-Powered Street Safety Device', 'IOT RESEARCH · ATRIA IMPACT PROJECT',
 'An IoT-based safety monitoring device using Raspberry Pi for real-time threat detection and edge computing.',
 'IoT-based safety monitoring device using Raspberry Pi. Focused on real-time threat detection, edge computing, hardware integration, and embedded-system documentation.',
 'An IoT-based safety monitoring device using Raspberry Pi for real-time threat detection and edge computing.',
 'IoT-based safety monitoring device using Raspberry Pi. Focused on real-time threat detection, edge computing, hardware integration, and embedded-system documentation.',
 NULL, 'SELECTED WORK', NULL, 'https://kev-ai-device.vercel.app/',
 TRUE, TRUE, TRUE, 30,
 '{"stack":["Raspberry Pi","IoT","Real-time threat detection","Edge computing","Hardware integration"],"visual":"awarespan","displayPeriod":"Oct 2025 — Present"}'::jsonb,
 '{"slug":true,"name":true,"tagline":true,"summary":true,"description":true,"status":true,"liveUrl":true,"featured":true,"customFields.stack":true,"customFields.visual":true,"customFields.displayPeriod":true}'::jsonb),
('hermes-the-quizzer', 'Hermes the Quizzer', 'FULL STACK WEB APPLICATION · PERSONAL',
 'A React/Vite and Express MCQ platform with PostgreSQL, JWT authentication and timed or untimed quizzes.',
 'React/Vite and Express-based MCQ platform with PostgreSQL. Includes JWT authentication with refresh tokens, rate limiting, timed and untimed quizzes, priority-based question selection, post-quiz review, admin CRUD, JSON import/export, and responsive dark/light themes.',
 'A React/Vite and Express MCQ platform with PostgreSQL, JWT authentication and timed or untimed quizzes.',
 'React/Vite and Express-based MCQ platform with PostgreSQL. Includes JWT authentication with refresh tokens, rate limiting, timed and untimed quizzes, priority-based question selection, post-quiz review, admin CRUD, JSON import/export, and responsive dark/light themes.',
 NULL, 'SELECTED WORK', 'https://github.com/bchbenjamin/hermes', NULL,
 TRUE, TRUE, TRUE, 40,
 '{"stack":["React","Vite","Express","PostgreSQL","JWT"],"visual":"clipz","displayPeriod":"2026"}'::jsonb,
 '{"slug":true,"name":true,"tagline":true,"summary":true,"description":true,"status":true,"repositoryUrl":true,"liveUrl":true,"featured":true,"customFields.stack":true,"customFields.visual":true,"customFields.displayPeriod":true}'::jsonb),
('academic-result-management-system', 'Academic Result Management System', 'JAVA HACKATHON · PERSONAL',
 'A Java 17 desktop application for role-based academic result workflows and automated performance metrics.',
 'Java 17/Maven desktop application backed by MariaDB. Replaces flat-file workflows with role-based student, evaluator, and administrator access, automated performance metrics, inline CRUD, and a 1v1 gauntlet leaderboard with multi-subject tie-breaking. Built with Java Swing and FlatLaf.',
 'A Java 17 desktop application for role-based academic result workflows and automated performance metrics.',
 'Java 17/Maven desktop application backed by MariaDB. Replaces flat-file workflows with role-based student, evaluator, and administrator access, automated performance metrics, inline CRUD, and a 1v1 gauntlet leaderboard with multi-subject tie-breaking. Built with Java Swing and FlatLaf.',
 NULL, 'SELECTED WORK', 'https://github.com/bchbenjamin/results', NULL,
 FALSE, TRUE, TRUE, 50,
 '{"stack":["Java 17","Maven","MariaDB","Java Swing","FlatLaf"],"visual":"siddhi","displayPeriod":"2026"}'::jsonb,
 '{"slug":true,"name":true,"tagline":true,"summary":true,"description":true,"status":true,"repositoryUrl":true,"liveUrl":true,"featured":true,"customFields.stack":true,"customFields.visual":true,"customFields.displayPeriod":true}'::jsonb),
('peer-management-platform', 'Peer Management Platform', 'STUDENT COORDINATION SYSTEM · PERSONAL',
 'A student coordination platform for attendance, lookup, feedback, account management and Excel reporting.',
 'Next.js and Prisma-based coordination platform using a Neon-backed database. Supports attendance, student lookup, group-discussion feedback, account management, TOTP/QR authentication, and Excel report generation.',
 'A student coordination platform for attendance, lookup, feedback, account management and Excel reporting.',
 'Next.js and Prisma-based coordination platform using a Neon-backed database. Supports attendance, student lookup, group-discussion feedback, account management, TOTP/QR authentication, and Excel report generation.',
 NULL, 'SELECTED WORK', 'https://github.com/bchbenjamin/peer-management', NULL,
 FALSE, TRUE, TRUE, 60,
 '{"stack":["Next.js","Prisma","Neon","TOTP / QR authentication","Excel report generation"],"visual":"siddhi","displayPeriod":"2026"}'::jsonb,
 '{"slug":true,"name":true,"tagline":true,"summary":true,"description":true,"status":true,"repositoryUrl":true,"liveUrl":true,"featured":true,"customFields.stack":true,"customFields.visual":true,"customFields.displayPeriod":true}'::jsonb),
('breach-defend', 'Breach & Defend', 'MULTIPLAYER CODING GAME · AWS STUDENT BUILDER GROUP',
 'A LAN-hosted real-time social-deduction coding game with synchronized multiplayer matches and coding-puzzle grading.',
 'LAN-hosted real-time social-deduction coding game built with Next.js and Socket.io. Implements developer, hacker, and firewall roles, synchronized matches, coding-puzzle grading, difficulty-based task pools, persistent game state, and an administrative control panel.',
 'A LAN-hosted real-time social-deduction coding game with synchronized multiplayer matches and coding-puzzle grading.',
 'LAN-hosted real-time social-deduction coding game built with Next.js and Socket.io. Implements developer, hacker, and firewall roles, synchronized matches, coding-puzzle grading, difficulty-based task pools, persistent game state, and an administrative control panel.',
 NULL, 'SELECTED WORK', 'https://github.com/bchbenjamin/aws-vigyaanrang', NULL,
 FALSE, TRUE, TRUE, 70,
 '{"stack":["Next.js","Socket.io","LAN networking","Real-time multiplayer","Coding-puzzle grading"],"visual":"aiida","displayPeriod":"Mar 2026"}'::jsonb,
 '{"slug":true,"name":true,"tagline":true,"summary":true,"description":true,"status":true,"repositoryUrl":true,"liveUrl":true,"featured":true,"customFields.stack":true,"customFields.visual":true,"customFields.displayPeriod":true}'::jsonb)
ON CONFLICT (slug) DO UPDATE SET
 name = EXCLUDED.name, tagline = EXCLUDED.tagline, summary = EXCLUDED.summary,
 description = EXCLUDED.description, short_description = EXCLUDED.short_description,
 resume_description = EXCLUDED.resume_description, role = EXCLUDED.role, status = EXCLUDED.status,
 repository_url = EXCLUDED.repository_url, live_url = EXCLUDED.live_url, featured = EXCLUDED.featured,
 published = EXCLUDED.published, resume_included = EXCLUDED.resume_included, sort_order = EXCLUDED.sort_order,
 custom_fields = EXCLUDED.custom_fields, public_fields = EXCLUDED.public_fields, updated_at = now();

-- Verified work experience and the résumé's listed campus/club roles.
INSERT INTO experience
(role_title, organization, employment_type, location, description, started_on, ended_on, is_current,
 published, resume_included, sort_order, custom_fields, public_fields)
VALUES
('FOSSEE Summer Intern', 'FOSSEE · IIT Bombay', 'SUMMER INTERNSHIP', 'Bengaluru',
 'Contributed to open-source Python software. Developed a Blender add-on integrating classy_blocks for structured OpenFOAM hexahedral meshing, including geometry-driven mesh generation and validation workflows. Drafted technical presentation materials and delivered production-ready Python code with rigorous test coverage.',
 DATE '2026-02-01', DATE '2026-08-31', FALSE, TRUE, TRUE, 10,
 '{"displayPeriod":"Feb 2026 — Aug 2026","repositoryUrl":"https://github.com/bchbenjamin/classy_blender_mesh"}'::jsonb,
 '{"roleTitle":true,"organization":true,"employmentType":true,"location":true,"description":true,"startedOn":true,"endedOn":true,"isCurrent":true,"customFields.displayPeriod":true,"customFields.repositoryUrl":true}'::jsonb),
('CDC Student Placement Intern', 'Atria Institute of Technology', 'PLACEMENT INTERNSHIP', 'Bengaluru',
 'Managed campus recruitment drives and technical coordination. Communicated project statuses clearly to cross-functional stakeholders and synthesized technical feedback for continuous improvement.',
 DATE '2026-05-01', NULL, TRUE, TRUE, TRUE, 20,
 '{"displayPeriod":"May 2026 — Present"}'::jsonb,
 '{"roleTitle":true,"organization":true,"employmentType":true,"location":true,"description":true,"startedOn":true,"isCurrent":true,"customFields.displayPeriod":true}'::jsonb),
('Full Stack Web Dev Intern', 'Rotaract & CS&E Department', 'FULL-STACK INTERNSHIP', 'Bengaluru',
 'Engineered a secure web-based authenticator application. Handled HTTP requests, API routing, authentication, database integrations, and rigorous testing. Awarded a perfect 10/10 grade for robust use-case execution.',
 DATE '2025-11-01', DATE '2026-01-31', FALSE, TRUE, TRUE, 30,
 '{"displayPeriod":"Nov 2025 — Jan 2026","repositoryUrl":"https://github.com/bchbenjamin/kevlify-auth"}'::jsonb,
 '{"roleTitle":true,"organization":true,"employmentType":true,"location":true,"description":true,"startedOn":true,"endedOn":true,"isCurrent":true,"customFields.displayPeriod":true,"customFields.repositoryUrl":true}'::jsonb),
('Campus Ambassador', 'Chess.com', 'COMMUNITY / AMBASSADOR', NULL,
 'Campus ambassador supporting Chess.com engagement and chess-related community outreach.',
 DATE '2026-09-01', NULL, TRUE, TRUE, TRUE, 40,
 '{"displayPeriod":"Sep 2026 — Present"}'::jsonb,
 '{"roleTitle":true,"organization":true,"employmentType":true,"description":true,"startedOn":true,"isCurrent":true,"customFields.displayPeriod":true}'::jsonb),
('Technical Developer', 'Cybersecurity Club · Atria IT', 'CLUB / TECHNICAL ROLE', NULL,
 'Engaged in security operations and threat intelligence research. Drafted comprehensive vulnerability analysis reports, technical use-cases, and awareness campaigns.',
 DATE '2026-04-01', NULL, TRUE, TRUE, TRUE, 50,
 '{"displayPeriod":"Apr 2026 — Present"}'::jsonb,
 '{"roleTitle":true,"organization":true,"employmentType":true,"description":true,"startedOn":true,"isCurrent":true,"customFields.displayPeriod":true}'::jsonb),
('Technical & Development Lead', 'AWS Student Builder Group · Atria IT', 'LEADERSHIP', NULL,
 'Event Head for Breach & Defend 2026. Led development of the LAN-hosted multiplayer coding game, contributed technical tooling, and coordinated secure event-lab deployments.',
 DATE '2026-03-01', NULL, TRUE, TRUE, TRUE, 60,
 '{"displayPeriod":"Mar 2026 — Present"}'::jsonb,
 '{"roleTitle":true,"organization":true,"employmentType":true,"description":true,"startedOn":true,"isCurrent":true,"customFields.displayPeriod":true}'::jsonb),
('Technical Team Member', 'Atria Code Committee · Atria IT', 'CLUB / TECHNICAL ROLE', NULL,
 'Led code quality initiatives, peer code reviews, and design discussions. Fostered technical writing standards and rapid collaborative problem-solving.',
 DATE '2026-01-01', DATE '2026-04-30', FALSE, TRUE, TRUE, 70,
 '{"displayPeriod":"Jan 2026 — Apr 2026"}'::jsonb,
 '{"roleTitle":true,"organization":true,"employmentType":true,"description":true,"startedOn":true,"endedOn":true,"isCurrent":true,"customFields.displayPeriod":true}'::jsonb);

INSERT INTO education
(institution, qualification, field_of_study, location, description, started_on, ended_on, grade,
 published, resume_included, sort_order, custom_fields, public_fields)
VALUES
('Atria Institute of Technology', 'Bachelor of Engineering', 'Computer Science', 'Bengaluru',
 'B.E. Computer Science · Batch of 2028', DATE '2024-01-01', DATE '2028-12-31', NULL, TRUE, TRUE, 10,
 '{"displayPeriod":"2024 — 2028"}'::jsonb,
 '{"institution":true,"qualification":true,"fieldOfStudy":true,"location":true,"description":true,"startedOn":true,"endedOn":true,"customFields.displayPeriod":true}'::jsonb),
('Bishop Cotton Boys’ School', 'ISC (Class XII)', NULL, 'Bengaluru',
 'SAT: 1340', DATE '2022-01-01', DATE '2024-12-31', 'SAT: 1340', TRUE, TRUE, 20,
 '{"displayPeriod":"2022 — 2024"}'::jsonb,
 '{"institution":true,"qualification":true,"location":true,"description":true,"startedOn":true,"endedOn":true,"grade":true,"customFields.displayPeriod":true}'::jsonb),
('St Ann’s High School', 'ICSE (Class X)', NULL, 'Bengaluru',
 NULL, DATE '2012-01-01', DATE '2022-12-31', NULL, TRUE, TRUE, 30,
 '{"displayPeriod":"2012 — 2022"}'::jsonb,
 '{"institution":true,"qualification":true,"location":true,"startedOn":true,"endedOn":true,"customFields.displayPeriod":true}'::jsonb);

-- Skill groups are curated from the résumé's explicit technical skills and areas of focus.
INSERT INTO skill_groups (name, description, published, sort_order, public_fields)
SELECT source.name, source.description, TRUE, source.sort_order, '{"name":true,"description":true}'::jsonb
FROM (VALUES
 ('PROGRAMMING', 'Programming languages', 10),
 ('FRAMEWORKS & BACKEND', 'Application and backend frameworks', 20),
 ('DATABASES & TOOLS', 'Data stores and development tools', 30),
 ('AREAS OF FOCUS', 'Technical focus areas', 40)
) AS source(name, description, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM skill_groups existing WHERE existing.name = source.name);

INSERT INTO skills (group_id, name, sort_order, resume_included, public_fields)
SELECT g.id, source.skill_name, source.sort_order, TRUE, '{"name":true}'::jsonb
FROM (VALUES
 ('PROGRAMMING','Python',10),('PROGRAMMING','Java',20),('PROGRAMMING','C++',30),('PROGRAMMING','JavaScript',40),('PROGRAMMING','TypeScript',50),
 ('FRAMEWORKS & BACKEND','React',10),('FRAMEWORKS & BACKEND','Node.js',20),('FRAMEWORKS & BACKEND','FastAPI',30),
 ('DATABASES & TOOLS','PostgreSQL',10),('DATABASES & TOOLS','MySQL',20),('DATABASES & TOOLS','MongoDB',30),('DATABASES & TOOLS','Git',40),
 ('AREAS OF FOCUS','Python Development',10),('AREAS OF FOCUS','Data Engineering',20),('AREAS OF FOCUS','Artificial Intelligence',30),('AREAS OF FOCUS','Technical Research & Documentation',40)
) AS source(group_name, skill_name, sort_order)
JOIN skill_groups g ON g.name = source.group_name
ON CONFLICT (group_id, name) DO UPDATE SET resume_included = TRUE, sort_order = EXCLUDED.sort_order,
 public_fields = '{"name":true}'::jsonb, updated_at = now();
UPDATE skill_groups SET published = TRUE, public_fields = '{"name":true,"description":true}'::jsonb
WHERE name IN ('PROGRAMMING', 'FRAMEWORKS & BACKEND', 'DATABASES & TOOLS', 'AREAS OF FOCUS');

INSERT INTO achievements (category, title, detail, issuer, published, resume_included, sort_order, public_fields)
SELECT source.category, source.title, source.detail, source.issuer, TRUE, TRUE, source.sort_order,
       '{"category":true,"title":true,"detail":true,"issuer":true}'::jsonb
FROM (VALUES
 ('AWARD','Best Project Award (10/10 Grade)','Web-Based TOTP Authenticator','Rotaract & CS&E Department',10),
 ('AWARD','Highest Score','Full-Stack Internship','Rotaract & CS&E Department',20),
 ('CERTIFICATION','Responsive Web Design Developer','freeCodeCamp · 300 hours','freeCodeCamp',30),
 ('CERTIFICATION','NPTEL DSA in Java','NPTEL certification','NPTEL',40),
 ('CERTIFICATION','OOP using Python','Certification / fundamentals',NULL,50),
 ('CERTIFICATION','DBMS Part 1','Certification / fundamentals',NULL,60),
 ('CERTIFICATION','Agile Scrum','Certification / fundamentals',NULL,70),
 ('CLOUD','20+ GCP Skills Badges','Including Pub/Sub, Cloud Functions, and API Gateway','Google Cloud',80),
 ('COMMUNITY','GDG Campus Member','Google Developer Groups campus community','Google Developer Groups',90),
 ('COMMUNITY','AWS Cloud Club Core Team','Campus cloud community','AWS Cloud Club',100),
 ('COMMUNITY','Chess.com Campus Ambassador','September 2026 — Present','Chess.com',110),
 ('CHESS','Peak Chess.com Rating: 2200','Peak rating on chess.com','Chess.com',120)
) AS source(category, title, detail, issuer, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM achievements existing WHERE existing.title = source.title);

-- Home presentation: gallery first, then the existing content sections. Both draft and
-- published configs begin with this order; the owner can change it in Site Builder.
UPDATE site_configuration
SET draft_config = jsonb_build_object('home', jsonb_build_object(
  'sections', '[
    {"id":"image-gallery","type":"image-gallery","enabled":true,"order":1},
    {"id":"hero","type":"hero","enabled":true,"order":10},
    {"id":"principles","type":"principles","enabled":true,"order":15},
    {"id":"achievement-gallery","type":"achievement-gallery","enabled":true,"order":20},
    {"id":"projects","type":"projects","enabled":true,"order":30},
    {"id":"about","type":"about","enabled":true,"order":40},
    {"id":"skills","type":"skills","enabled":true,"order":50},
    {"id":"contact","type":"contact","enabled":true,"order":60}
  ]'::jsonb,
  'content', '{
    "heroEyebrow":"5TH-SEMESTER B.E. COMPUTER SCIENCE / BATCH OF 2028",
    "focus":"Python Development · Data Engineering · Artificial Intelligence · Technical Research & Documentation",
    "aboutTitle":"Technical curiosity.\nPractical engineering.",
    "aboutParagraphs":[
      "I am a 5th-semester B.E. Computer Science student (Batch of 2028) with a strong foundation in Python Development, Data Engineering and Technical Research.",
      "At FOSSEE, IIT Bombay, I develop Python automation and Blender/OpenFOAM tooling and prepare technical documentation. Recognized with a perfect 10/10 grade for software implementation, I am interested in AI/ML solutions, technical research, automation and data-driven software engineering."
    ],
    "projectsTitle":"Selected projects.",
    "projectsDescription":"Software, AI, data and systems work documented in my résumé.",
    "skillsTitle":"Technologies and tools.",
    "skillsDescription":"Languages, frameworks, databases and technical focus areas.",
    "contactTitle":"Have a worthwhile engineering problem?",
    "contactDescription":"Get in touch to discuss software, AI, data engineering or technical research."
  }'::jsonb
)),
    published_config = jsonb_build_object('home', jsonb_build_object(
  'sections', '[
    {"id":"image-gallery","type":"image-gallery","enabled":true,"order":1},
    {"id":"hero","type":"hero","enabled":true,"order":10},
    {"id":"principles","type":"principles","enabled":true,"order":15},
    {"id":"achievement-gallery","type":"achievement-gallery","enabled":true,"order":20},
    {"id":"projects","type":"projects","enabled":true,"order":30},
    {"id":"about","type":"about","enabled":true,"order":40},
    {"id":"skills","type":"skills","enabled":true,"order":50},
    {"id":"contact","type":"contact","enabled":true,"order":60}
  ]'::jsonb,
  'content', '{
    "heroEyebrow":"5TH-SEMESTER B.E. COMPUTER SCIENCE / BATCH OF 2028",
    "focus":"Python Development · Data Engineering · Artificial Intelligence · Technical Research & Documentation",
    "aboutTitle":"Technical curiosity.\nPractical engineering.",
    "aboutParagraphs":[
      "I am a 5th-semester B.E. Computer Science student (Batch of 2028) with a strong foundation in Python Development, Data Engineering and Technical Research.",
      "At FOSSEE, IIT Bombay, I develop Python automation and Blender/OpenFOAM tooling and prepare technical documentation. Recognized with a perfect 10/10 grade for software implementation, I am interested in AI/ML solutions, technical research, automation and data-driven software engineering."
    ],
    "projectsTitle":"Selected projects.",
    "projectsDescription":"Software, AI, data and systems work documented in my résumé.",
    "skillsTitle":"Technologies and tools.",
    "skillsDescription":"Languages, frameworks, databases and technical focus areas.",
    "contactTitle":"Have a worthwhile engineering problem?",
    "contactDescription":"Get in touch to discuss software, AI, data engineering or technical research."
  }'::jsonb
)), updated_at = now(), published_at = now()
WHERE id = 1;

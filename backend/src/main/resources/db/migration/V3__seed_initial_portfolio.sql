INSERT INTO profile (full_name, headline, summary, location, email, website_url, github_url, published)
VALUES (
  'Benjamin',
  'Computer Science & Engineering undergraduate',
  'I build useful software for complex, real-world problems. I work across full-stack applications, applied machine learning, data workflows and edge devices, with a bias toward practical things that can be tested, shipped and improved.',
  'India', 'me@bchbenjamin.in', 'https://bchbenjamin.in', 'https://github.com/bchbenjamin', TRUE
);

INSERT INTO projects (slug, name, tagline, summary, description, role, status, repository_url, featured, published, sort_order)
VALUES
('awarespan', 'AWARESPAN', 'EDGE AI / SAFETY SYSTEMS', 'An AI-powered safety device designed to bring local threat detection and connected alerts to edge hardware.', 'AWARESPAN explores a modular, on-premise safety system built around a Raspberry Pi node. The current work focuses on local visual threat detection, a separable processing pipeline and a foundation for reliable alerts without requiring the node to expose itself directly to mobile clients.', 'Core platform and AI integration', 'IN DEVELOPMENT', 'https://github.com/awarespan/node-core-processing', TRUE, TRUE, 10),
('siddhi', 'Siddhi', 'FULL-STACK / PRODUCT ENGINEERING', 'A role-aware platform with dedicated views for students and guardians, designed around useful information and clear navigation.', 'Siddhi is a full-stack application being developed with an emphasis on clear role-specific experiences, report views and a consistent application shell. The work includes frontend architecture, database-backed features and the details that make a product feel coherent across screens.', 'Full-stack development', 'ACTIVE BUILD', 'https://github.com/bchbenjamin/siddhi', TRUE, TRUE, 20),
('ai-ida', 'AI-IDA', 'NLP / INTELLIGENT DATA ANALYTICS', 'A detection pipeline for suspicious internship and job opportunities across messaging and email channels.', 'AI-IDA investigates how structured message metadata and unstructured content can be combined to identify potentially fraudulent opportunities. The approach includes data collection and cleaning, duplicate and forwarded-message handling, text representations, classification and a semantic explanation layer.', 'Introduction and core AI integration', 'ACADEMIC PROJECT', 'https://github.com/bchbenjamin/AI_IDA', TRUE, TRUE, 30),
('clipz', 'ClipZ', 'PYTHON / DESKTOP SOFTWARE', 'A lightweight desktop video editor designed to stay usable on low-spec PCs.', 'ClipZ is a small-footprint video-editing concept with a simple Tkinter interface and a deliberate focus on minimal dependencies and straightforward distribution. The project avoids heavyweight AI features in favour of a practical desktop tool.', 'Independent design and development', 'INDEPENDENT PROJECT', NULL, TRUE, TRUE, 40);

INSERT INTO experience (role_title, organization, employment_type, description, published, sort_order)
VALUES ('Engineering Intern', 'FOSSEE — OpenFOAM', 'Internship', 'Worked with OpenFOAM during a technical internship, gaining hands-on experience with an engineering simulation tool alongside university coursework.', TRUE, 10);

INSERT INTO achievements (category, title, detail, issuer, published, sort_order)
VALUES
('CHESS', 'U-19 District Runner-up', 'Bengaluru Urban · Boys · 2024', 'Bengaluru Urban District', TRUE, 10),
('COMMUNITY', 'Chess.com Ambassador', 'Community ambassador', 'Chess.com', TRUE, 20),
('ACADEMICS', '9.00 Semester GPA', 'Semester 4', 'Academic record', TRUE, 30);

INSERT INTO skill_groups (name, published, sort_order) VALUES
('PRODUCT & WEB', TRUE, 10), ('AI & DATA', TRUE, 20), ('SYSTEMS & TOOLS', TRUE, 30);
INSERT INTO skills (group_id, name, sort_order)
SELECT id, skill, ord FROM skill_groups CROSS JOIN (VALUES
  ('PRODUCT & WEB', 'TypeScript', 10), ('PRODUCT & WEB', 'JavaScript', 20), ('PRODUCT & WEB', 'React', 30), ('PRODUCT & WEB', 'Next.js', 40), ('PRODUCT & WEB', 'HTML', 50), ('PRODUCT & WEB', 'CSS', 60),
  ('AI & DATA', 'Python', 10), ('AI & DATA', 'Machine Learning', 20), ('AI & DATA', 'Natural Language Processing', 30), ('AI & DATA', 'Data Analytics', 40),
  ('SYSTEMS & TOOLS', 'Java', 10), ('SYSTEMS & TOOLS', 'Linux', 20), ('SYSTEMS & TOOLS', 'Git', 30), ('SYSTEMS & TOOLS', 'Raspberry Pi', 40), ('SYSTEMS & TOOLS', 'Edge Computing', 50)
) AS s(group_name, skill, ord) WHERE skill_groups.name = s.group_name;

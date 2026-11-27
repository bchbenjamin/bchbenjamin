export const resources:Record<string,{table:string;fields:Record<string,string>;required:string[];order:string}> = {
  "profile": {
    "table": "profile",
    "fields": {
      "fullName": "full_name",
      "headline": "headline",
      "summary": "summary",
      "location": "location",
      "email": "email",
      "websiteUrl": "website_url",
      "githubUrl": "github_url",
      "profilePhotoId": "profile_photo_id",
      "linkedinUrl": "linkedin_url",
      "published": "published",
      "publicFields": "public_fields",
      "customFields": "custom_fields"
    },
    "required": [
      "fullName",
      "headline",
      "summary"
    ],
    "order": "updated_at DESC"
  },
  "projects": {
    "table": "projects",
    "fields": {
      "slug": "slug",
      "name": "name",
      "tagline": "tagline",
      "summary": "summary",
      "description": "description",
      "shortDescription": "short_description",
      "resumeDescription": "resume_description",
      "role": "role",
      "status": "status",
      "repositoryUrl": "repository_url",
      "liveUrl": "live_url",
      "featured": "featured",
      "published": "published",
      "resumeIncluded": "resume_included",
      "sortOrder": "sort_order",
      "startedOn": "started_on",
      "completedOn": "completed_on",
      "publicFields": "public_fields",
      "customFields": "custom_fields"
    },
    "required": [
      "slug",
      "name",
      "tagline",
      "summary",
      "description",
      "status"
    ],
    "order": "sort_order, name"
  },
  "experience": {
    "table": "experience",
    "fields": {
      "roleTitle": "role_title",
      "organization": "organization",
      "employmentType": "employment_type",
      "location": "location",
      "description": "description",
      "startedOn": "started_on",
      "endedOn": "ended_on",
      "isCurrent": "is_current",
      "published": "published",
      "resumeIncluded": "resume_included",
      "sortOrder": "sort_order",
      "publicFields": "public_fields",
      "customFields": "custom_fields"
    },
    "required": [
      "roleTitle",
      "organization",
      "description"
    ],
    "order": "sort_order, started_on DESC"
  },
  "education": {
    "table": "education",
    "fields": {
      "institution": "institution",
      "qualification": "qualification",
      "fieldOfStudy": "field_of_study",
      "location": "location",
      "description": "description",
      "startedOn": "started_on",
      "endedOn": "ended_on",
      "grade": "grade",
      "published": "published",
      "resumeIncluded": "resume_included",
      "sortOrder": "sort_order",
      "publicFields": "public_fields",
      "customFields": "custom_fields"
    },
    "required": [
      "institution",
      "qualification"
    ],
    "order": "sort_order, started_on DESC"
  },
  "skill-groups": {
    "table": "skill_groups",
    "fields": {
      "name": "name",
      "description": "description",
      "published": "published",
      "sortOrder": "sort_order",
      "publicFields": "public_fields",
      "customFields": "custom_fields"
    },
    "required": [
      "name"
    ],
    "order": "sort_order, name"
  },
  "skills": {
    "table": "skills",
    "fields": {
      "groupId": "group_id",
      "name": "name",
      "proficiency": "proficiency",
      "resumeIncluded": "resume_included",
      "sortOrder": "sort_order",
      "publicFields": "public_fields",
      "customFields": "custom_fields"
    },
    "required": [
      "groupId",
      "name"
    ],
    "order": "group_id, sort_order, name"
  },
  "achievements": {
    "table": "achievements",
    "fields": {
      "category": "category",
      "title": "title",
      "detail": "detail",
      "awardedOn": "awarded_on",
      "issuer": "issuer",
      "credentialUrl": "credential_url",
      "published": "published",
      "resumeIncluded": "resume_included",
      "sortOrder": "sort_order",
      "publicFields": "public_fields",
      "customFields": "custom_fields"
    },
    "required": [
      "category",
      "title",
      "detail"
    ],
    "order": "sort_order, awarded_on DESC"
  }
};

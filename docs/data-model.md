# Data model

```mermaid
erDiagram
  USER ||--o{ LEAD : owns
  USER ||--o{ ACTIVITY : creates
  CONTACT ||--o{ CONTACT_COMPANY : linked
  COMPANY ||--o{ CONTACT_COMPANY : linked
  COMPANY ||--o{ OPPORTUNITY : associated
  CONTACT ||--o{ ACTIVITY : has
  USER ||--o{ AUDIT_LOG : performs
```

`ContactCompany` is a join table supporting the required many-to-many contact/company relationship. Opportunity team collaboration and custom-field metadata are identified extension points; add `OpportunityMember` and `CustomFieldDefinition/Value` tables when implementing those expanded requirements.

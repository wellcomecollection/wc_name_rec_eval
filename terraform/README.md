# Terraform DNS Infrastructure

This directory contains Terraform configuration that manages **only Route 53 DNS records** required for email authentication and custom MAIL FROM support for the `wellcomecollection.org` domain in the context of this AWS Amplify project.

## Scope

Managed via Terraform here:

* Hosted zone lookup (data source) for `wellcomecollection.org`.
* Three Amazon SES DKIM selector CNAME records.
* A DMARC monitoring TXT record (`_dmarc.wellcomecollection.org`) with a `p=none` policy (no enforcement; enables future reporting if rua/ruf tags are added later).
* Custom MAIL FROM domain records for SES in `eu-west-2`:
  * MX record pointing at `feedback-smtp.eu-west-2.amazonses.com`.
  * SPF (TXT) record: `v=spf1 include:amazonses.com ~all` (scoped to the MAIL FROM subdomain, separate from the apex SPF already present outside this config).
  * Application CNAME for `narese.wellcomecollection.org` -> `d3nrdbrjtfgvc3.cloudfront.net` (Amplify distribution).
  * ACM/Amplify domain validation CNAME for `narese.wellcomecollection.org`.

## Out of Scope

All application hosting, APIs, storage, and related infrastructure are provisioned by **AWS Amplify** (see project root / Amplify configuration). This Terraform module intentionally avoids overlapping with Amplify-managed resources.

## Apply Workflow

1. Ensure AWS credentials/assume role permitting Route 53 changes (role specified in `terraform.tf`).
2. Run `terraform init` (first time or after provider changes).
3. Run `terraform plan` to review proposed DNS record creations.
4. Run `terraform apply` to create the records.

## Verification (Post-Apply)

Example dig checks (optional):

```bash
dig +short CNAME g6j34hsjpzr3g5gylbmsaab7nr4zoedq._domainkey.wellcomecollection.org
dig +short TXT _dmarc.wellcomecollection.org
dig +short MX  ses-eu-west-2.wellcomecollection.org
dig +short TXT ses-eu-west-2.wellcomecollection.org
dig +short CNAME narese.wellcomecollection.org || dig +short A narese.wellcomecollection.org
```

## narese records

Two records are managed for the application subdomain:

```hcl
resource "aws_route53_record" "narese" { # Points the subdomain to Amplify/CloudFront
  name    = "narese.wellcomecollection.org"
  type    = "CNAME"
  records = ["d3nrdbrjtfgvc3.cloudfront.net"]
  ttl     = 300
}

resource "aws_route53_record" "narese_domain_validation" { # ACM validation token
  name    = "_ba97b5f71e8caa1a4ddb90a021418ef0.narese.wellcomecollection.org"
  type    = "CNAME"
  records = ["_69037f5d999b22d83f4f04a6ac8466b3.xlfgrmvvlj.acm-validations.aws"]
  ttl     = 300
}
```

If Amplify rotates validation tokens in the future, update only the `narese_domain_validation` record.

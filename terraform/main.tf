# Look up the hosted zone for wellcomecollection.org
data "aws_route53_zone" "wellcomecollection_org" {
  name     = "wellcomecollection.org."
  provider = aws.dns
}

# DKIM CNAME records
resource "aws_route53_record" "dkim_1" {
  zone_id  = data.aws_route53_zone.wellcomecollection_org.zone_id
  name     = "g6j34hsjpzr3g5gylbmsaab7nr4zoedq._domainkey.wellcomecollection.org"
  type     = "CNAME"
  ttl      = 300
  records  = ["g6j34hsjpzr3g5gylbmsaab7nr4zoedq.dkim.amazonses.com"]
  provider = aws.dns
}

resource "aws_route53_record" "dkim_2" {
  zone_id  = data.aws_route53_zone.wellcomecollection_org.zone_id
  name     = "snr5tjslon4rcxtcd65fjrxmk4g2spnr._domainkey.wellcomecollection.org"
  type     = "CNAME"
  ttl      = 300
  records  = ["snr5tjslon4rcxtcd65fjrxmk4g2spnr.dkim.amazonses.com"]
  provider = aws.dns
}

resource "aws_route53_record" "dkim_3" {
  zone_id  = data.aws_route53_zone.wellcomecollection_org.zone_id
  name     = "3pti23e56njonwgmiluz32tqtdylhkpv._domainkey.wellcomecollection.org"
  type     = "CNAME"
  ttl      = 300
  records  = ["3pti23e56njonwgmiluz32tqtdylhkpv.dkim.amazonses.com"]
  provider = aws.dns
}

# DMARC TXT record
resource "aws_route53_record" "dmarc" {
  zone_id  = data.aws_route53_zone.wellcomecollection_org.zone_id
  name     = "_dmarc.wellcomecollection.org"
  type     = "TXT"
  ttl      = 300
  records  = ["v=DMARC1; p=none;"]
  provider = aws.dns
}

# Custom MAIL FROM MX record
resource "aws_route53_record" "mail_from_mx" {
  zone_id  = data.aws_route53_zone.wellcomecollection_org.zone_id
  name     = "ses-eu-west-2.wellcomecollection.org"
  type     = "MX"
  ttl      = 300
  records  = ["10 feedback-smtp.eu-west-2.amazonses.com"]
  provider = aws.dns
}

# Custom MAIL FROM SPF TXT record
resource "aws_route53_record" "mail_from_spf" {
  zone_id  = data.aws_route53_zone.wellcomecollection_org.zone_id
  name     = "ses-eu-west-2.wellcomecollection.org"
  type     = "TXT"
  ttl      = 300
  records  = ["v=spf1 include:amazonses.com ~all"]
  provider = aws.dns
}

# Application hostname for narese.wellcomecollection.org
# Points subdomain at Amplify/CloudFront distribution. If distribution/domain changes,
# update the CNAME target below. For direct IP mapping, switch to an A record.
# TTL kept at 300 for flexibility; increase once stable (e.g. 3600).
resource "aws_route53_record" "narese" {
  zone_id = data.aws_route53_zone.wellcomecollection_org.zone_id
  name    = "narese.wellcomecollection.org"
  type    = "CNAME"
  ttl     = 300
  records = ["dxgo04u22oiyj.cloudfront.net"]
  provider = aws.dns
}

# Amplify / ACM domain validation CNAME for narese.wellcomecollection.org
resource "aws_route53_record" "narese_domain_validation" {
  zone_id  = data.aws_route53_zone.wellcomecollection_org.zone_id
  name     = "_ba97b5f71e8caa1a4ddb90a021418ef0.narese.wellcomecollection.org"
  type     = "CNAME"
  ttl      = 300
  records  = ["_69037f5d999b22d83f4f04a6ac8466b3.xlfgrmvvlj.acm-validations.aws"]
  provider = aws.dns
}

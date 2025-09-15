provider "aws" {
  region = "eu-west-1"
  alias  = "dns"

  assume_role {
    role_arn = "arn:aws:iam::267269328833:role/wellcomecollection-assume_role_hosted_zone_update"
  }

  default_tags {
    tags = {
      TerraformConfigurationURL = "https://github.com/wellcomecollection/wellcomecollection.org/tree/main/cache"
      Department                = "Digital Platform"
      Division                  = "Culture and Society"
      Use                       = "Front-end CloudFront distributions"
    }
  }
}

terraform {
  required_version = ">= 0.9"

  backend "s3" {
  # Authentication for the backend must be supplied via environment variables or
  # an AWS profile. The S3 backend does not support an inline assume_role block.
  # If you have a local profile that assumes the required role, specify it here.
  profile       = "platform-developer"
    bucket         = "wellcomecollection-platform-infra"
    key            = "terraform/wc_name_rec_eval.tfstate"
    dynamodb_table = "terraform-locktable"
    region         = "eu-west-1"
  }
}
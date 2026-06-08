<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/b0082bdf-0ed9-4ce0-8ec2-15750534b19a

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`


   GEMINI_API_KEY="TU_API_KEY_DE_GEMINI"
APP_URL="http://IP_DEL_SERVIDOR"
AWS_S3_ENDPOINT="http://localhost:9000"
AWS_S3_ACCESS_KEY_ID="aws_mock_key_id"
AWS_S3_SECRET_ACCESS_KEY="aws_mock_secret_key"
AWS_S3_BUCKET_NAME="soporte-pmo-bucket"
AWS_S3_REGION="us-east-1"

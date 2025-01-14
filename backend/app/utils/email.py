# backend/app/utils/email.py
import sib_api_v3_sdk
from sib_api_v3_sdk.rest import ApiException
from pydantic import EmailStr
from ..config import settings

async def send_verification_email(email: str, code: str):
    # API yapılandırması
    configuration = sib_api_v3_sdk.Configuration()
    configuration.api_key['api-key'] = settings.BREVO_API_KEY

    # API örneği oluştur
    api_instance = sib_api_v3_sdk.TransactionalEmailsApi(sib_api_v3_sdk.ApiClient(configuration))

    # Email içeriği
    subject = "Güvenli Mesajlaşma ve Bulut Depolama Platformu - Email Doğrulama"
    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333; text-align: center;">Email Doğrulama</h2>
        <div style="background-color: #f8f9fa; border-radius: 5px; padding: 20px; margin: 20px 0;">
            <p style="margin-bottom: 20px;">Güvenli Mesajlaşma ve Bulut Depolama Platformuna hoş geldiniz!</p>
            <p style="margin-bottom: 10px;">Doğrulama kodunuz:</p>
            <div style="background-color: #e9ecef; padding: 10px; border-radius: 5px; text-align: center; font-size: 24px; font-weight: bold;">
                {code}
            </div>
        </div>
    </div>
    """

    try:
        # Email gönderimi için gerekli parametreler
        sender = {"name": "Güvenli Mesajlaşma ve Şifreli Bulut Depolama Platformu", "email": settings.BREVO_SENDER_EMAIL}
        to = [{"email": email}]

        send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
            to=to,
            sender=sender,
            subject=subject,
            html_content=html_content
        )

        # Email'i gönder
        api_instance.send_transac_email(send_smtp_email)
        return True
    except ApiException as e:
        print(f"Email gönderme hatası: {e}")
        return False
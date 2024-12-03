# backend/app/utils/email.py
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from pydantic import EmailStr
import os
from dotenv import load_dotenv

load_dotenv()

conf = ConnectionConfig(
    MAIL_USERNAME=os.getenv("MAIL_USERNAME"),
    MAIL_PASSWORD=os.getenv("MAIL_PASSWORD"),
    MAIL_FROM=os.getenv("MAIL_FROM"),
    MAIL_PORT=587,
    MAIL_SERVER="smtp.gmail.com",
    MAIL_TLS=True,
    MAIL_SSL=False,
    USE_CREDENTIALS=True
)

async def send_verification_email(email: EmailStr, code: str):
    html = f"""
    <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Email Doğrulama</h2>
        <p>Güvenli Mesajlaşma uygulamasına hoş geldiniz!</p>
        <p>Doğrulama kodunuz: <strong style="font-size: 24px;">{code}</strong></p>
        <p>Bu kodu uygulama üzerinde ilgili alana girerek hesabınızı doğrulayabilirsiniz.</p>
    </div>
    """

    message = MessageSchema(
        subject="Email Doğrulama",
        recipients=[email],
        body=html,
        subtype="html"
    )

    fm = FastMail(conf)
    await fm.send_message(message)
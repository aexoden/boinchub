# SPDX-FileCopyrightText: 2025-present Jason Lynch <jason@aexoden.com>
#
# SPDX-License-Identifier: MIT
"""Encryption utilities for sensitive data."""

import base64

from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

from boinchub.core.settings import settings


class AccountKeyEncryption:
    """Service for encrypting/decrypting user account keys."""

    def __init__(self) -> None:
        """Initialize the encryption service."""
        self._fernet: Fernet | None = None

    def _get_fernet(self) -> Fernet:
        """Get or create Fernet instance for encryption/decryption.

        Returns:
            Fernet: The Fernet instance for encryption/decryption.

        """
        if self._fernet is None:
            # Derive key from master secret and salt
            salt = settings.encryption_salt.encode()
            kdf = PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=salt, iterations=100000)
            key = base64.urlsafe_b64encode(kdf.derive(settings.master_encryption_key.encode()))
            self._fernet = Fernet(key)

        return self._fernet

    def encrypt_account_key(self, plaintext_key: str) -> str:
        """Encrypt an account key for storage.

        Args:
            plaintext_key (str): The account key to encrypt.

        Returns:
            str: The encrypted account key, base64-encoded.

        """
        if not plaintext_key:
            return ""

        fernet = self._get_fernet()
        encrypted = fernet.encrypt(plaintext_key.encode())
        return base64.urlsafe_b64encode(encrypted).decode()

    def decrypt_account_key(self, encrypted_key: str) -> str:
        """Decrypt an account key from storage.

        Args:
            encrypted_key (str): The encrypted account key, base64-encoded.

        Returns:
            str: The decrypted account key.

        """
        if not encrypted_key:
            return ""

        try:
            fernet = self._get_fernet()
            encrypted_bytes = base64.urlsafe_b64decode(encrypted_key.encode())
            decrypted = fernet.decrypt(encrypted_bytes)
            return decrypted.decode()
        except Exception:  # noqa: BLE001
            return ""


_encryption_service = AccountKeyEncryption()


def encrypt_account_key(plaintext_key: str) -> str:
    """Encrypt an account key for storage.

    Args:
        plaintext_key (str): The account key to encrypt.

    Returns:
        str: The encrypted account key, base64-encoded.

    """
    return _encryption_service.encrypt_account_key(plaintext_key)


def decrypt_account_key(encrypted_key: str) -> str:
    """Decrypt an account key from storage.

    Args:
        encrypted_key (str): The encrypted account key, base64-encoded.

    Returns:
        str: The decrypted account key.

    """
    return _encryption_service.decrypt_account_key(encrypted_key)

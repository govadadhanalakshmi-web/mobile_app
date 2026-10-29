<?php
declare(strict_types=1);

/**
 * Enterprise HS256 JWT (JSON Web Token) Helper
 * Technology-Agnostic, Zero-External-Dependency JWT Implementation
 */

class JwtHelper
{
    /**
     * Generate an HS256 JWT Token
     *
     * @param array $payload
     * @param string $secret
     * @param int $expirySeconds Default 7 days
     * @return string
     */
    public static function generate(array $payload, string $secret, int $expirySeconds = 604800): string
    {
        $now = time();
        $header = [
            'alg' => 'HS256',
            'typ' => 'JWT'
        ];

        $payload['iat'] = $now;
        $payload['exp'] = $now + $expirySeconds;

        $headerEncoded = self::base64UrlEncode((string)json_encode($header, JSON_UNESCAPED_SLASHES));
        $payloadEncoded = self::base64UrlEncode((string)json_encode($payload, JSON_UNESCAPED_SLASHES));

        $dataToSign = "{$headerEncoded}.{$payloadEncoded}";
        $rawSignature = hash_hmac('sha256', $dataToSign, $secret, true);
        $signatureEncoded = self::base64UrlEncode($rawSignature);

        return "{$dataToSign}.{$signatureEncoded}";
    }

    /**
     * Verify and Decode an HS256 JWT Token
     *
     * @param string $token
     * @param string $secret
     * @return array
     * @throws RuntimeException
     */
    public static function verify(string $token, string $secret): array
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            throw new RuntimeException('Malformed JWT token structure');
        }

        [$headerEncoded, $payloadEncoded, $signatureEncoded] = $parts;

        // Verify Signature
        $dataToSign = "{$headerEncoded}.{$payloadEncoded}";
        $expectedRawSig = hash_hmac('sha256', $dataToSign, $secret, true);
        $expectedSigEncoded = self::base64UrlEncode($expectedRawSig);

        if (!hash_equals($expectedSigEncoded, $signatureEncoded)) {
            throw new RuntimeException('Invalid token signature');
        }

        // Decode Payload
        $payloadJson = self::base64UrlDecode($payloadEncoded);
        $payload = json_decode($payloadJson, true);
        if (!is_array($payload)) {
            throw new RuntimeException('Invalid token payload encoding');
        }

        // Check Expiry
        if (isset($payload['exp']) && $payload['exp'] < time()) {
            throw new RuntimeException('Token has expired');
        }

        return $payload;
    }

    /**
     * Base64URL Encode
     */
    public static function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    /**
     * Base64URL Decode
     */
    public static function base64UrlDecode(string $data): string
    {
        $remainder = strlen($data) % 4;
        if ($remainder) {
            $data .= str_repeat('=', 4 - $remainder);
        }
        return base64_decode(strtr($data, '-_', '+/')) ?: '';
    }
}


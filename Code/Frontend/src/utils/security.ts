/**
 * Simple XOR encryption for localStorage
 * NOTE: This is obfuscation, not secure encryption. 
 * Real security should rely on backend proxying without exposing keys to frontend storage.
 */

export const encryptKey = (key: string): string => {
    if (!key) return '';
    const salt = 'AUTOLOGIC_SECURE';
    return btoa(
        key.split('').map((char, i) =>
            String.fromCharCode(char.charCodeAt(0) ^ salt.charCodeAt(i % salt.length))
        ).join('')
    );
};

export const decryptKey = (encrypted: string): string => {
    if (!encrypted) return '';
    try {
        const salt = 'AUTOLOGIC_SECURE';
        return atob(encrypted).split('').map((char, i) =>
            String.fromCharCode(char.charCodeAt(0) ^ salt.charCodeAt(i % salt.length))
        ).join('');
    } catch (e) {
        console.warn('Failed to decrypt key', e);
        return '';
    }
};

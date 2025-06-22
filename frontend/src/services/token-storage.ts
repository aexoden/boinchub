class TokenStorageService {
    private static instance: TokenStorageService | null = null;
    private accessToken: string | null = null;
    private tokenExpiration: Date | null = null;
    private readonly ACCESS_TOKEN_KEY = "access_token";
    private readonly TOKEN_EXPIRATION_KEY = "token_expiration";

    private constructor() {
        // Load token from session storage on initialization
        this.loadFromSessionStorage();

        // Clear session storage token on page unload
        window.addEventListener("beforeunload", () => {
            this.clearSessionStorage();
        });
    }

    public static getInstance(): TokenStorageService {
        TokenStorageService.instance ??= new TokenStorageService();
        return TokenStorageService.instance;
    }

    public setAccessToken(token: string, expiresIn: number): void {
        this.accessToken = token;
        this.tokenExpiration = new Date(Date.now() + expiresIn * 1000);

        try {
            sessionStorage.setItem(this.ACCESS_TOKEN_KEY, token);
            sessionStorage.setItem(this.TOKEN_EXPIRATION_KEY, this.tokenExpiration.toISOString());
        } catch (error) {
            console.warn("Failed to store access token in session storage:", error);
        }
    }

    public getAccessToken(): string | null {
        if (!this.accessToken) {
            this.loadFromSessionStorage();
        }

        return this.accessToken;
    }

    public clearAccessToken(): void {
        this.accessToken = null;
        this.tokenExpiration = null;
        this.clearSessionStorage();
    }

    public hasAccessToken(): boolean {
        return this.getAccessToken() !== null;
    }

    private loadFromSessionStorage(): void {
        try {
            const stored = sessionStorage.getItem(this.ACCESS_TOKEN_KEY);
            const storedExpiration = sessionStorage.getItem(this.TOKEN_EXPIRATION_KEY);

            if (stored) {
                this.accessToken = stored;
            }

            if (storedExpiration) {
                this.tokenExpiration = new Date(storedExpiration);
            }
        } catch (error) {
            console.warn("Failed to load access token from session storage:", error);
        }
    }

    private clearSessionStorage(): void {
        try {
            sessionStorage.removeItem(this.ACCESS_TOKEN_KEY);
            sessionStorage.removeItem(this.TOKEN_EXPIRATION_KEY);
        } catch (error) {
            console.warn("Failed to clear access token from session storage:", error);
        }
    }

    public getTokenExpiration(): Date | null {
        if (!this.tokenExpiration) {
            this.loadFromSessionStorage();
        }

        return this.tokenExpiration;
    }

    public isTokenExpired(bufferSeconds = 60): boolean {
        const expiration = this.getTokenExpiration();
        if (!expiration) return true;

        const now = new Date();
        const expirationWithBuffer = new Date(expiration.getTime() - bufferSeconds * 1000);

        return now >= expirationWithBuffer;
    }
}

export const tokenStorage = TokenStorageService.getInstance();

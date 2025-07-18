export const tokenService = {
    setToken: (token) => {
        localStorage.setItem('token', token);
    },

    getToken: () => {
        return localStorage.getItem('token');
    },

    removeToken: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },

    isTokenExpired: (token) => {
        if (!token) return true;

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const currentTime = Date.now() / 1000;
            return payload.exp < currentTime;
        } catch (error) {
            return true;
        }
    }
};

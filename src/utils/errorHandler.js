export const handleAxiosError = (error) => {
    throw new Error(error.message);
};

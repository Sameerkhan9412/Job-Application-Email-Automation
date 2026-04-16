export const formatEmail = (email: string) => {
  return email.trim().toLowerCase();
};

export const validateEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const capitalize = (str: string) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
};


export const toTitleCase=(str:string)=> {
  return str
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map(word => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}
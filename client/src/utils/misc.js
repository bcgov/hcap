export const scrollUp = () => window.scrollTo({top: 0, behavior: 'smooth'});
export const matchRuleShort = (str, rule) => {
  const escapeRegex = (str) => str.replace(/([.*+?^=!:${}()|[\]/\\])/g, "\\$1");
  return new RegExp("^" + rule.split("*").map(escapeRegex).join(".*") + "$").test(str);
}

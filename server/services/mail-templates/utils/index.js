const html = (strings, ...rest) => String.raw({ raw: strings }, ...rest);

const COLORS = {
  green: "#13bf94",
  red: "#f24949"
};

const ICONS = {
  up:
    "http://cdn.mcauto-images-production.sendgrid.net/999ed28dd779fb18/a7295bc5-e5a2-49fd-b96b-b2425e8139c4/3125x2084.png",
  down:
    "http://cdn.mcauto-images-production.sendgrid.net/999ed28dd779fb18/e92dca7f-e886-423d-9569-93daa6577b29/3125x2084.png"
};

const getColor = (newValue, previousValue) =>
  newValue >= previousValue ? COLORS.green : COLORS.red;

const getIcon = (newValue, previousValue) =>
  newValue >= previousValue ? ICONS.up : ICONS.down;

module.exports = {
  html,
  getColor,
  getIcon
};

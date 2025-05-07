import { pino } from "pino";

const formatObjectMessage = (o: any, level: string): string => {
  const date = new Date(o.time);
  delete o.time
  const hour = date.getHours();
  const minute = date.getMinutes();
  const second = date.getSeconds();
  const millis = date.getMilliseconds();
  const timeString = `${hour}:${minute}:${second}.${millis}`
  const message = o.msg;
  delete o.msg;
  delete o.level;
  return `[${timeString}][${level}] ${message}`
};

export const logger = pino({
  browser: {
    asObject: true,
    write: {
      trace: (o: object) => {
        console.trace(formatObjectMessage(o, "T"), o);
      },
      debug: (o: object) => {
        console.debug(formatObjectMessage(o, "D"), o);
      },
      info: (o: object) => {
        console.info(formatObjectMessage(o, "I"), o);
      },
      warn: (o: object) => {
        console.warn(formatObjectMessage(o, "W"), o);
      },
      error: (o: object) => {
        console.error(formatObjectMessage(o, "E"), o);
      },
      fatal: (o: object) => {
        console.error(formatObjectMessage(o, "F"), o);
      },
    },
  },
});
logger.level = "trace";

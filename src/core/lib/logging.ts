type LogFunc = (message: string) => void;

const formatMessage = (level: string, path: string[], message: string): string => {
  const date = new Date();
  const hour = date.getHours();
  const minute = String(date.getMinutes()).padStart(2, "0");
  const second = String(date.getSeconds()).padStart(2, "0");
  const millis = String(date.getMilliseconds()).padStart(3, "0");
  const timeString = `${hour}:${minute}:${second}.${millis}`;
  let pathString = "";
  if (path.length > 0) {
    pathString = `[${path.join(".")}]`;
  }
  return `[${timeString}][${level}]${pathString} ${message}`;
};

const doLog = (logFunc: LogFunc, level: string, path: string[], message: string): void => {
  const formattedMessage = formatMessage(level, path, message);
  logFunc(formattedMessage);
};

export class Logger {
  private readonly path: string[];

  constructor(...path: string[]) {
    this.path = path;
  }

  child(...path: string[]): Logger {
    return new Logger(...[...this.path, ...path]);
  }

  debug(message: string) {
    doLog(console.debug, "D", this.path, message);
  }
}

export const rootLogger = new Logger();

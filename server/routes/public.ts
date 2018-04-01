import { Request, Response, Router } from "express";
import * as fs from "fs";
const publicRouter: Router = Router();

publicRouter.get("/code_confirmation", (request: Request, response: Response) => {
  let phone: string = request.query.phone;
  if (!phone)
    return response.status(500).json({ error: "Le champ phone doit être renseigné" });
  let content: string = fs.readFileSync("codes.json", "utf8");
  let codes: any[] = content ? JSON.parse(content) : [];
  let findedIndex = codes.findIndex(item => {
    return item['phone'] == phone;
  });
  let password = findedIndex != -1 ? codes[findedIndex]['password'] : uniqueId();
  if (findedIndex != -1)
    codes.splice(findedIndex, 1);
  let code: number = getRandomIntInclusive(10000, 99999);
  codes.push({ code, phone, password, date: Date.now() });
  fs.writeFile('codes.json', JSON.stringify(codes), (err) => {
    if (err) {
      response.status(500).json({ err });
    }
    return response.json({ code, phone });
  });
});
publicRouter.get("/verifier_code_confirmation", (request: Request, response: Response) => {
  let phone: string = request.query.phone;
  let code: string = request.query.code;
  if (!phone)
    return response.status(500).json({ error: "Le champ phone doit être renseigné" });
  if (!code)
    return response.status(500).json({ error: "Le champ code doit être renseigné" });
  fs.readFile('codes.json', "utf8", (err, data) => {
    if (err) {
      response.status(500).json({ err });
    }
    let codes: any[] = data ? JSON.parse(data) : [];
    let finded = codes.find(item => {
      return item['code'] == code && item['phone'] == phone;
    });

    if (finded) {
      let now = Date.now();
      let millis: number = Date.now() - finded["date"];
      millis = Math.floor(millis / 1000);
      if (millis > (60 * 30)) {
        return response.status(500).json({ error: "Le code de confirmation lié au téléphone est expiré" });
      }
      let password = finded["password"];
      return response.json({ password });
    } else {
      return response.status(500).json({ error: "Le code de confirmation lié au téléphone est incorrect" });
    }
  });
});
function getRandomIntInclusive(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function uniqueId(): string { //permet de générer un code unique
  //xxx-xxx-xxxx-xxxx
  const caracteres: string =
    'ABCDEFGHIJKLMOPQRSTUVWXYZabcdefghijklmopqrstuvwxyz0123456789';
  let length = Math.floor(Math.random() * 15) + 10;
  let str: string = '',
    randomLetter: string = '';
  for (let i = 0; i < length; i++) {
    randomLetter =
      caracteres[Math.floor(Math.random() * (60 - 1 + 1)) + 1] || '';
    str += length % 3 == 0 ? randomLetter : 'x';
  }
  let uuid = str.replace(/[xy]/g, function (c) {
    let r = (Math.random() * 16) | 0,
      v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
  return uuid + Date.now();
}
export { publicRouter };

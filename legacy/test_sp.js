import { servicePublicApi } from "./orizen-backend/src/services/servicePublicApi.js";
async function test() {
  const res = await servicePublicApi.searchDroits("vol carte d identite");
  console.log(JSON.stringify(res, null, 2));
}
test();

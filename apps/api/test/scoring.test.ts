import { describe, it, expect } from "vitest";
function scoreLead(x:{email:string;phone?:string;source?:string}) {
  return Math.min(100,30+(x.phone?20:0)+(x.source?15:0)+(x.email.includes("company")?10:0));
}
describe("lead scoring",()=> {
  it("adds explainable points for phone and source",()=>expect(scoreLead({email:"a@b.com",phone:"123",source:"web"})).toBe(65));
  it("caps score at 100",()=>expect(scoreLead({email:"company@company.com",phone:"1",source:"web"})).toBe(75));
});

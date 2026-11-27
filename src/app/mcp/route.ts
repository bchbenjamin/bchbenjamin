// Preserve the previous deliberate security lockout until a separate review.
const deny=()=>Response.json({error:"agent_access_disabled"},{status:403,headers:{"Cache-Control":"no-store"}});
export const GET=deny,POST=deny,PUT=deny,DELETE=deny,PATCH=deny;

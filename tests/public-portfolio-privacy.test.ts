import {expect,it} from "vitest";
import {publicRecord,mapCollection} from "../src/lib/server/public-portfolio";
it("denies unspecified fields, removes internal IDs and never exposes a profile photo through custom fields",()=>{
 const source={id:"private",full_name:"Public name",summary:"Secret text",profile_photo_id:"secret-photo",profile_photo_url:"secret-url",public_fields:{fullName:true,"customFields.profilePhotoUrl":true},custom_fields:{profilePhotoUrl:"malicious override",privateField:"private"}};
 expect(publicRecord(source)).toEqual({fullName:"Public name"});
});
it("honors field overrides even with wildcard visibility",()=>{
 expect(publicRecord({name:"Public",description:"Private",public_fields:{"*":true,description:false}})).toEqual({name:"Public"});
});
it("excludes projects without a visible name and slug",()=>{
 expect(mapCollection("projects",[{name:"Secret",slug:"secret",public_fields:{slug:true},public_media:[]}])).toEqual([]);
});

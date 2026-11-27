export function isValidIsoDate(value) {
 if(!value)return true;if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
 const [y,m,d]=value.split("-").map(Number),date=new Date(Date.UTC(y,m-1,d));
 return date.getUTCFullYear()===y&&date.getUTCMonth()===m-1&&date.getUTCDate()===d;
}
export function validateCourseDiscount({fixedFeeMinor,discountType,discountValue,discountStartsAt,discountEndsAt}) {
 if(!["none","percentage","fixed"].includes(discountType))return "Select a valid discount type.";
 if(discountType==="none")return null;
 if(!Number.isSafeInteger(fixedFeeMinor)||fixedFeeMinor<1)return "A positive fixed course fee is required before applying a discount.";
 if(!Number.isSafeInteger(discountValue)||discountValue<1)return "Enter a valid positive discount.";
 if(discountType==="percentage"&&discountValue>100)return "Percentage discount must be between 1 and 100.";
 if(discountType==="fixed"&&discountValue>=fixedFeeMinor)return "Fixed discount must be less than the course fee.";
 if(!isValidIsoDate(discountStartsAt)||!isValidIsoDate(discountEndsAt))return "Enter valid discount dates.";
 if(discountStartsAt&&discountEndsAt&&discountEndsAt<discountStartsAt)return "The discount end date cannot be earlier than its start date.";
 return null;
}
export function calculateCoursePrice(course,today=new Date().toISOString().slice(0,10)) {
 if(course?.fixed_fee_minor===null||course?.fixed_fee_minor===undefined||course?.fixed_fee_minor==="")return {discount_active:false,discount_amount_minor:0,final_fee_minor:null};
 const base=Number(course.fixed_fee_minor);
 if(!Number.isSafeInteger(base)||base<0)return {discount_active:false,discount_amount_minor:0,final_fee_minor:null};
 const type=course?.discount_type||"none",value=Number(course?.discount_value);
 const active=type!=="none"&&Number.isSafeInteger(value)&&value>0&&(!course?.discount_starts_at||today>=course.discount_starts_at)&&(!course?.discount_ends_at||today<=course.discount_ends_at);
 if(!active)return {discount_active:false,discount_amount_minor:0,final_fee_minor:base};
 const raw=type==="percentage"?Math.round(base*value/100):type==="fixed"?value:0,amount=Math.min(base,Math.max(0,raw));
 return {discount_active:amount>0,discount_amount_minor:amount,final_fee_minor:base-amount};
}

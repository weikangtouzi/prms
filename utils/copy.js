function depCopy(target, source) {
    // 1.通过遍历拿到source中所有的属性
    for(let key in source){
        // console.log(key);
        // 2.取出当前遍历到的属性对应的取值
        let sourceValue = source[key];
        // console.log(sourceValue);
        // 3.判断当前的取值是否是引用数据类型
        if(sourceValue instanceof Object){
            // console.log(sourceValue.constructor);
            // console.log(new sourceValue.constructor);
            let subTarget = new sourceValue.constructor;
            target[key] = subTarget;
            depCopy(subTarget, sourceValue);
        }else{
            target[key] = sourceValue;
        }
    }
}
module.exports = {
    depCopy
}
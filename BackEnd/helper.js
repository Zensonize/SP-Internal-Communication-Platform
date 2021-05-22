function time_el(time_st) {
    return (Date.now() - time_st) / 1000
}

function calcDataLen(data) {
    length = 0;
    for (i in data) {
        length += data[i].length
    }
    return length
}

function calcHop(node, tp) {

    if (node === String(tp.nodeId)){
      return 0
    }
    else if ("subs" in tp) {
      for (i in tp.subs) {
        var dfs = calcHop(node, tp.subs[i]);
        if (dfs != -1) {
            return 1 + dfs
        }
      }
      return -1
    } else {
      return -1
    }
}

function convertDstAddr(dst) {
    // console.log(typeof dst);
    var lenA = dst.length - 5;
    toA = parseInt(dst.slice(0, lenA));
    toB = parseInt(dst.slice(-5));
  
    return [toA, toB];
}

function chunkSubstr(str, size) {
    const numChunks = Math.ceil(str.length / size);
    const chunks = new Array(numChunks);
  
    for (let i = 0, o = 0; i < numChunks; ++i, o += size) {
      chunks[i] = str.substr(o, size);
    }
  
    return chunks;
}

function search(topology, target) {
    console.log("topology",topology,"target",target)
    if (topology.nodeId === target) {
        console.log("match target")
        return [topology.nodeId];
    } else if (topology.subs) {
        console.log("topology have subs")
        console.log("sub length", topology.subs.length,"sub nodeId", topology.subs)
        for (let i = 0; i < topology.subs.length; i++) {
            
            let current = topology.subs[i];
            // we can't parse JSON format
            console.log("stringify data",JSON.stringify(current.nodeId))
            console.log("current subs",current.nodeId,"target subs",target)
            let result = [search(current.nodeId, target),target];
            // let result = [current.nodeId, target];
            if (result.includes(undefined)){
                result = result.filter(function (element){
                    return element !== undefined
                })   
            }
            console.log("result from search",result)
            if (result) {
                result.unshift(topology.nodeId);
                return result;
            }
        }
    }
    return undefined;
}

function toCustomString(list) {
    console.log("custom list",list)
    return list.join(' -> ');
}

function routingPath(destination, topology) {
    return toCustomString(search(topology,destination))
}

module.exports = { 
    time_el,
    calcDataLen,
    calcHop,
    convertDstAddr,
    chunkSubstr,
    routingPath
}
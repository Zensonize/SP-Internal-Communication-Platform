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
    if (topology.nodeId === target) {
        return [topology.nodeId];
    } else if (topology.subs) {
        for (let i = 0; i < topology.subs.length; i++) {
            let current = topology.subs[i];
            let result = search(current, target);
            if (result) {
                result.unshift(topology.nodeId);
                return result;
            }
        }
    }
    return undefined;
}

function toCustomString(list) {
    return list.join(' -> ');
}

function routingPath(topology, destination) {
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
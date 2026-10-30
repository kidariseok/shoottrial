import Foundation
let sr=44100.0, tau=Double.pi*2
var state:UInt64=932710
func noise()->Double{state=state &* 6364136223846793005 &+ 1;return Double((state>>33)&0x7fffffff)/1073741824.0-1}
let root=CommandLine.arguments[1]
func shot(_ t:Double,_ heavy:Bool=false)->Double {
    if t<0{return 0}
    let edge=noise()*exp(-t/(heavy ? 0.013:0.006))
    let body=sin(tau*((heavy ? 80.0:140.0)*t+10*0.018*(1-exp(-t/0.018))))*exp(-t/(heavy ? 0.14:0.045))
    let chamber=sin(tau*920*t)*exp(-t/0.012)*0.18
    let tail=noise()*exp(-t/(heavy ? 0.20:0.065))*0.18
    return edge*0.75+body*0.9+chamber+tail
}
func cannon(_ t:Double)->Double{
    if t<0{return 0}
    return sin(tau*(42*t+38*0.04*(1-exp(-t/0.04))))*exp(-t/0.34)*0.9+noise()*exp(-t/0.08)*0.65+sin(tau*116*t)*exp(-t/0.18)*0.35
}
func write(_ name:String,_ sec:Double,_ kind:Int)throws{
    let n=Int(sr*sec);var samples=[Double](repeating:0,count:n);var lp=0.0;var phase=0.0
    for i in 0..<n{
        let t=Double(i)/sr;var x=0.0
        switch kind{
        case 0:x=shot(t)+shot(t-0.085)*0.12+sin(tau*2650*t)*exp(-pow((t-0.16)/0.009,2))*0.08
        case 1:x=shot(t)+shot(t-0.095)*0.91+shot(t-0.19)*0.86
        case 2:x=shot(t,true)+shot(t-0.13,true)*0.12
        case 3:
            lp += 0.045*(noise()-lp)
            phase += tau*(68+42*t/sec)/sr
            let tread=(0.5+0.5*pow(sin(tau*7.5*t),8))
            let engine=sin(phase)*0.38+sin(phase*2.02)*0.20+sin(phase*3)*0.08
            let move=min(1,t/0.35)*min(1,(sec-t)/0.55)
            x=(engine+lp*1.6+tread*lp*0.8)*move
        case 4:
            lp += 0.06*(noise()-lp)
            x=cannon(t)+lp*exp(-t/0.35)*0.6+cannon(t-0.22)*0.10
        case 5:
            if t<0.96{
                phase += tau*(1900-1400*pow(t/0.96,1.7))/sr
                x=sin(phase)*(0.025+0.09*t)*min(1,t/0.06)
            }else{x=cannon(t-0.96)*0.95}
        default:
            let gate = t<0.22 || (t>0.31 && t<0.56) || (t>0.65 && t<1.0)
            if gate{x=(sin(tau*440*t)+sin(tau*587.33*t)*0.45)*0.22}
        }
        samples[i]=x*min(1,t/0.0005)*min(1,max(0,(sec-t)/0.04))
    }
    // 직전 타격의 짧은 잔향을 추가해 공간감을 주되 다음 사격을 가리지 않는다.
    if kind != 3{
        for (d,g) in [(0.047,0.12),(0.091,0.07),(0.153,0.04)]{
            let delay=Int(d*sr)
            for i in delay..<n{samples[i]+=samples[i-delay]*g}
        }
    }
    let peak=samples.map{abs($0)}.max() ?? 1
    let level=kind==3 ? 0.46:0.72
    var pcm=Data();pcm.reserveCapacity(n*2)
    for sample in samples{
        var v=Int16(max(-32767,min(32767,Int(sample/max(peak,0.001)*level*32767)))).littleEndian
        withUnsafeBytes(of:&v){pcm.append(contentsOf:$0)}
    }
    var data=Data()
    func str(_ x:String){data.append(x.data(using:.ascii)!)}
    func u32(_ x:UInt32){var v=x.littleEndian;withUnsafeBytes(of:&v){data.append(contentsOf:$0)}}
    func u16(_ x:UInt16){var v=x.littleEndian;withUnsafeBytes(of:&v){data.append(contentsOf:$0)}}
    str("RIFF");u32(UInt32(pcm.count+36));str("WAVEfmt ");u32(16);u16(1);u16(1);u32(UInt32(sr));u32(UInt32(sr)*2);u16(2);u16(16);str("data");u32(UInt32(pcm.count));data.append(pcm)
    try data.write(to:URL(fileURLWithPath:root+"/"+name+".wav"))
    print(name,sec)
}
try write("sfx_rifle_shot",0.42,0)
try write("sfx_rifle_burst",0.65,1)
try write("sfx_heavy_shot",0.95,2)
try write("sfx_armored_arrival",2.8,3)
try write("sfx_cannon_shot",1.65,4)
try write("sfx_mortar_incoming",2.2,5)
try write("sfx_boss_warning",1.15,6)

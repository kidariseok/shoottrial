import Foundation

// 외부 샘플 없이 작곡한 전자음악 시안. 타악기와 악기 파형도 직접 합성한다.
let sr = 32000.0
let pi2 = Double.pi * 2
func hz(_ note: Int) -> Double { 440 * pow(2, Double(note - 69) / 12) }
func soft(_ x: Double) -> Double { x / (1 + abs(x)) }
struct Voice {
    var at: Double; var dur: Double; var note: Int; var gain: Double; var kind: Int; var pan: Double
}
var seed: UInt64 = 48321
func noise() -> Double {
    seed = seed &* 6364136223846793005 &+ 1442695040888963407
    return Double((seed >> 33) & 0x7fffffff) / 1073741824.0 - 1
}
let outdir = CommandLine.arguments.count > 1 ? CommandLine.arguments[1] : "."

func render(_ name: String, _ bpm: Double, _ bars: Int, _ mode: Int) throws {
    let beat = 60 / bpm
    let duration = Double(bars) * 4 * beat
    let frames = Int((duration + 5) * sr)
    var left = [Float](repeating: 0, count: frames)
    var right = left
    var voices = [Voice]()
    func add(_ bar: Int, _ pos: Double, _ length: Double, _ note: Int, _ gain: Double, _ kind: Int, _ pan: Double = 0) {
        voices.append(Voice(at: (Double(bar) * 4 + pos) * beat, dur: length * beat, note: note, gain: gain, kind: kind, pan: pan))
    }
    // D단조 중심, Bb/Gm/A와 C/F를 섞어 구간별 색과 긴장감을 바꾼다.
    let chords = [[50,57,60,64], [46,53,57,60], [43,50,53,57], [45,52,55,61], [48,55,58,62], [41,48,53,57], [43,50,57,58], [45,52,55,61]]
    let theme = [0, 7, 10, 9, 7, 3, 2, -1, 0, 3, 7, 12, 10, 9, 7, 2]
    let shapes2 = [0.20,0.36,0.55,0.70,0.86,0.44,0.30,0.62,0.80,1.0,0.76,0.42]
    let shapes1 = [0.38,0.56,0.74,0.90,0.65,0.38,0.72,0.96,1.0,0.68,0.83,1.0,0.82,0.52]
    let shapes0 = [0.18,0.28,0.44,0.56,0.30,0.50,0.62,0.28]
    for bar in 0..<bars {
        let section = bar / 8
        let shape = mode == 2 ? shapes2[section % shapes2.count] : mode == 1 ? shapes1[section % shapes1.count] : shapes0[section % shapes0.count]
        let chord = chords[(bar / 2 + (section >= 6 ? 4 : 0)) % chords.count]
        let base = chord[0] - 12
        // 공간을 채우는 패드. 매번 다른 전위/팬·길이로 숨을 쉰다.
        if bar % 2 == 0 {
            for (i, n) in chord.enumerated() {
                add(bar, 0, 7.85, n + (mode == 0 ? 12 : 0), (mode == 0 ? 0.072 : 0.050) * (0.7 + shape), 0, Double(i) / 2 - 0.75)
            }
            add(bar, 0, 7.8, base, 0.09 * (0.7 + shape), 5, 0)
        }
        // 낮은 현의 맥박과 별도 저음. 높은 에너지 구간에서는 16분음표로 분열한다.
        if mode != 0 && (shape > 0.3 || bar >= 8) {
            let count = shape > 0.75 ? 16 : 8
            for k in 0..<count {
                let pos = Double(k) * 4 / Double(count)
                let choices = [chord[0],chord[1],chord[0]+12,chord[2]]
                let n = choices[(k + bar % 3) % choices.count]
                let accents = k % 4 == 0 ? 1.0 : 0.68
                add(bar, pos, 0.33, n, 0.08 * shape * accents, 1, k % 2 == 0 ? -0.35 : 0.30)
            }
            for k in 0..<4 {
                add(bar, Double(k), 0.72, k == 3 && bar % 4 == 3 ? base + 7 : base, 0.13 * shape, 2)
            }
        }
        // 선율은 전체 길이에서 항상 나오지 않는다. 4마디 질문/응답과 긴 음을 교차한다.
        if (mode == 0 && section % 3 != 0) || (mode != 0 && shape > 0.60 && bar % 8 >= 2) {
            for k in 0..<4 {
                let idx = (bar % 4) * 4 + k
                let offset = theme[(idx + (section % 3) * 3) % theme.count]
                let note = 62 + offset + (mode == 1 && section >= 7 ? 12 : 0)
                if mode == 0 && k % 2 == 1 { continue }
                add(bar, Double(k) + (k == 2 ? 0.06 : 0), mode == 0 ? 1.65 : (k == 3 ? 0.86 : 0.68), note, mode == 0 ? 0.11 : 0.095 * shape, mode == 0 ? 3 : 4, mode == 0 ? 0.20 : -0.12)
            }
        }
        // 반대편의 작고 밝은 펄스는 도입/긴장 완화 구간에서만 들린다.
        if shape < 0.6 || section % 4 == 2 {
            for k in 0..<4 {
                add(bar, Double(k) + 0.5, 0.8, chord[(k + bar) % 4] + 24, 0.028 + shape * 0.018, 3, k % 2 == 0 ? -0.65 : 0.65)
            }
        }
        if mode != 0 {
            // 발구름 같은 저음 타격, 반박 스네어, 금속 셰이커를 따로 편곡한다.
            for k in 0..<4 {
                if shape > 0.45 || k % 2 == 0 { add(bar, Double(k), 0.65, 36, 0.22 * (0.55 + shape), 6) }
                if shape > 0.52 && (k == 1 || k == 3) { add(bar, Double(k), 0.45, 38, 0.10 * shape, 7, 0.15) }
            }
            let hatN = shape > 0.72 ? 16 : 8
            if shape > 0.40 {
                for k in 0..<hatN { add(bar, Double(k) * 4 / Double(hatN), 0.16, 42, 0.025 * shape * (k % 2 == 0 ? 1.0 : 0.65), 8, k % 2 == 0 ? -0.6 : 0.5) }
            }
            if bar % 8 == 7 {
                let fillN = shape > 0.65 ? 8 : 4
                for k in 0..<fillN { add(bar, 3 + Double(k)/Double(fillN), 0.21, 38, 0.07 * (0.4 + Double(k)/Double(fillN)), 7, Double(k)/Double(fillN)-0.5) }
                add(bar, 2.5, 1.5, 60, 0.06 * shape, 10, -0.2)
            }
            if bar % 8 == 0 && bar > 0 { add(bar, 0, 4, 49, 0.10 * shape, 9, 0.35) }
            // 긴 브라스 저음 응답과 높은 스트링 하모니로 클라이맥스의 폭을 만든다.
            if shape > 0.8 && bar % 2 == 0 {
                for (i,n) in chord.prefix(3).enumerated() { add(bar, 0, 2.8, n + 12, 0.032 * shape, 4, Double(i)*0.5-0.5) }
            }
        } else if section >= 2 {
            for k in [0,2] { add(bar, Double(k), 0.7, 36, 0.075, 6) }
            if bar % 4 == 0 { add(bar, 0, 3, 49, 0.022, 9, 0.4) }
        }
    }
    print("Rendering \(name): \(Int(duration))s, \(voices.count) events")
    fflush(stdout)
    for v in voices {
        let start = Int(v.at * sr)
        let seconds = v.dur
        let release = v.kind == 0 ? 1.8 : v.kind == 3 ? 1.1 : 0.25
        let count = min(frames-start,Int((seconds+release)*sr))
        let f = hz(v.note)
        let lpan = sqrt((1-v.pan)*0.5), rpan = sqrt((1+v.pan)*0.5)
        var prevNoise = 0.0
        for i in 0..<max(0,count) {
            let t = Double(i)/sr
            var x=0.0,env=0.0
            let attack = v.kind == 0 ? 0.55 : v.kind == 4 ? 0.055 : 0.008
            let gate = min(1,t/attack) * (t <= seconds ? 1 : exp(-(t-seconds)/(release/5)))
            let phase = pi2*f*t
            switch v.kind {
            case 0: // 스테레오로 펼친 부드러운 다중 발진 패드
                x = sin(phase + 0.008*sin(pi2*0.22*t))*0.55 + sin(phase*1.003+0.3)*0.28 + sin(phase*0.997+0.6)*0.22 + sin(phase*2.001)*0.13
                env = gate * (0.82 + 0.18*sin(pi2*0.13*t))
            case 1: // 활의 짧은 어택을 가진 어두운 현 펄스
                x = sin(phase)*0.55 + sin(phase*2.002)*0.24 + sin(phase*3.001)*0.14 + sin(phase*4.003)*0.07 + sin(phase*0.998)*0.23
                env = gate * exp(-t/0.13)
            case 2: // 둥근 저음 펄스
                x = sin(phase+0.32*sin(phase*2))*0.85 + sin(phase*2)*0.12
                env = gate*exp(-t/0.40)
            case 3: // 잔향 있는 플럭
                x = sin(phase+1.25*exp(-t/0.08)*sin(phase*2)) + 0.12*sin(phase*3.002)*exp(-t/0.10)
                env = gate*exp(-t/(seconds*0.55+0.15))
            case 4: // 서서히 열리는 브라스/리드
                let wobble = 0.003*sin(pi2*4.8*t)*min(1,t/0.3)
                let ph = phase+wobble*phase/(1+t)
                x = sin(ph)+0.34*sin(ph*2.001)+0.18*sin(ph*3.001)+0.10*sin(ph*4)+0.04*sin(ph*5)
                env = gate*(0.78+0.22*exp(-t/0.12))
            case 5: x=sin(phase)+0.16*sin(phase*2);env=gate*0.65
            case 6: // 저음 드럼: 빠른 피치 하강+짧은 노이즈 어택
                x = sin(pi2*(43*t+15*0.045*(1-exp(-t/0.045))))*exp(-t/0.20) + noise()*0.10*exp(-t/0.012)
                env=min(1,t/0.002)
            case 7: // 스네어의 몸통과 스프링
                let n=noise();let high=n-prevNoise*0.68;prevNoise=n
                x=high*exp(-t/0.085)*0.65 + sin(pi2*184*t)*exp(-t/0.04)*0.3
                env=min(1,t/0.001)
            case 8: let n=noise();x=(n-prevNoise)*exp(-t/0.022);prevNoise=n;env=min(1,t/0.001)
            case 9: let n=noise();x=(n-prevNoise*0.8)*exp(-t/0.65);prevNoise=n;env=min(1,t/0.005)
            default: let n=noise();x=(n-prevNoise*0.8);prevNoise=n;env=min(1,t/max(seconds,0.01))*max(0,1-(t-seconds)/0.15)*0.7
            }
            let sample=Float(x*env*v.gain)
            left[start+i] += sample*Float(lpan)
            right[start+i] += sample*Float(rpan)
        }
    }
    // 초기 반사와 좌우가 다른 확산 지연으로 원음을 유지하며 잔향을 얇게 더한다.
    let taps: [(Double,Double)] = [(0.071,0.09),(0.113,0.075),(0.179,0.065),(0.251,0.05),(0.373,0.045),(0.529,0.032)]
    for (delay,gain) in taps {
        let d=Int(delay*sr)
        for i in d..<frames {
            let l=left[i-d],r=right[i-d]
            left[i] += r*Float(gain)
            right[i] += l*Float(gain)
        }
    }
    // 마지막 마디는 서서히 줄여 독립 음원으로도 자연스럽게 끝낸다.
    var peak=0.0
    for i in 0..<frames {
        let t=Double(i)/sr
        let fadeIn=min(1,t/0.15)
        let fadeOut=min(1,max(0,(duration+4-t)/6))
        let gain=fadeIn*fadeOut
        left[i]=Float(tanh(Double(left[i])*1.15)*gain)
        right[i]=Float(tanh(Double(right[i])*1.15)*gain)
        peak=max(peak,abs(Double(left[i])),abs(Double(right[i])))
    }
    let scale=0.87/max(peak,0.001)
    var pcm=Data(capacity:frames*4)
    for i in 0..<frames {
        for s in [left[i],right[i]] {
            var x=Int16(max(-32767,min(32767,Int(Double(s)*scale*32767)))).littleEndian
            withUnsafeBytes(of:&x){pcm.append(contentsOf:$0)}
        }
    }
    var wav=Data()
    func str(_ x:String){wav.append(x.data(using:.ascii)!)}
    func u32(_ x:UInt32){var n=x.littleEndian;withUnsafeBytes(of:&n){wav.append(contentsOf:$0)}}
    func u16(_ x:UInt16){var n=x.littleEndian;withUnsafeBytes(of:&n){wav.append(contentsOf:$0)}}
    str("RIFF");u32(UInt32(pcm.count+36));str("WAVEfmt ");u32(16);u16(1);u16(2);u32(UInt32(sr));u32(UInt32(sr)*4);u16(4);u16(16);str("data");u32(UInt32(pcm.count));wav.append(pcm)
    try wav.write(to:URL(fileURLWithPath:outdir+"/"+name+".wav"))
    print("Saved \(name), peak \(peak), frames \(frames)")
}
try render("01_perimeter_alert",124,96,2)
try render("02_last_defense",152,112,1)
try render("03_barracks_before_dawn",96,64,0)

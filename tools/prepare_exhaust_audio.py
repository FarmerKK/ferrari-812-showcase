"""Prepare CC0 Ferrari recordings for user-triggered browser playback."""
from pathlib import Path
import subprocess, sys, wave, json, re, urllib.request
import numpy as np
from scipy.signal import butter, sosfiltfilt
sys.path.insert(0, str(Path('output/audio/tools').resolve()))
import imageio_ffmpeg
ffmpeg=imageio_ffmpeg.get_ffmpeg_exe()
root=Path('output/audio')
root.mkdir(parents=True,exist_ok=True)
Path('public/audio').mkdir(parents=True,exist_ok=True)
pages={'acceleration':'https://freesound.org/people/biholao/sounds/370278/','idle':'https://freesound.org/people/jtvdb/sounds/857147/'}
for name in ['acceleration','idle']:
    source=root/f'ferrari-{name}-source.mp3'
    if not source.exists():
        html=urllib.request.urlopen(pages[name]).read().decode('utf-8')
        url=re.search(r'https://cdn\.freesound\.org/[^"\s]+-hq\.mp3',html).group(0)
        urllib.request.urlretrieve(url,source)
    subprocess.run([ffmpeg,'-y','-i',str(root/f'ferrari-{name}-source.mp3'),'-ac','1','-ar','22050',str(root/f'{name}.wav')],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    with wave.open(str(root/f'{name}.wav')) as f: rate=f.getframerate();data=np.frombuffer(f.readframes(f.getnframes()),np.int16).astype(float)/32768
    print(name,'duration',len(data)/rate,'peak',round(float(abs(data).max()),3))
    for t in range(0,len(data)//rate,3):
        a=data[t*rate:(t+3)*rate];print(t,round(float(np.sqrt(np.mean(a*a))),4),end='; ')
    print()
    if name=='acceleration':
        a=data[:rate*8];a[:int(rate*.08)]*=np.linspace(0,1,int(rate*.08));a[-int(rate*.2):]*=np.linspace(1,0,int(rate*.2))
        with wave.open(str(root/'rev-audition.wav'),'w') as out:out.setparams((1,2,rate,0,'NONE','not compressed'));out.writeframes((a*32767).astype(np.int16).tobytes())
    clips=[('exhaust-idle',8,20)] if name=='idle' else [('exhaust-rev',1,9),('exhaust-rev-long',15,24)]
    for filename,start,end in clips:
        clip=data[start*rate:end*rate].copy();clip=sosfiltfilt(butter(2,[55,8500],btype='bandpass',fs=rate,output='sos'),clip)
        clip*=.78/max(abs(clip).max(),.001)
        if name=='idle':
            # Join the end into the beginning over 150 ms; both ends share samples.
            n=int(.15*rate);ramp=np.linspace(0,1,n);clip[-n:]=clip[-n:]*(1-ramp)+clip[:n]*ramp;clip=clip[n:]
        else:
            n=int(.08*rate);clip[:n]*=np.linspace(0,1,n);n=int(.3*rate);clip[-n:]*=np.linspace(1,0,n)
        wav=root/f'{filename}.wav'
        with wave.open(str(wav),'w') as out:out.setparams((1,2,rate,0,'NONE','not compressed'));out.writeframes((clip*32767).astype(np.int16).tobytes())
        subprocess.run([ffmpeg,'-y','-i',str(wav),'-codec:a','libmp3lame','-b:a','160k',str(Path('public/audio')/f'{filename}.mp3')],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
        print(filename,'seconds',round(len(clip)/rate,3),'peak',round(float(abs(clip).max()),3),'rms',round(float(np.sqrt(np.mean(clip*clip))),3))
Path('public/audio/credits.json').write_text(json.dumps({'license':'CC0 1.0','note':'Ferrari recordings; the recordists do not identify an 812 Superfast. Edited excerpts for an illustrative showroom sound study.','sources':[{'author':'biholao','title':'Acceleration 1.wav','url':'https://freesound.org/people/biholao/sounds/370278/','cuts_seconds':[[1,9],[15,24]]},{'author':'jtvdb','title':'Ferrari_motor_idle','url':'https://freesound.org/people/jtvdb/sounds/857147/','cuts_seconds':[[8,20]]}],'edits':'55 Hz high-pass, 8.5 kHz low-pass, peak normalization, fades and idle loop join'},indent=2),encoding='utf-8')

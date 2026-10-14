// Locally hosted, CC0 Ferrari recordings; playback begins only after a gesture.
export class ExhaustAudio {
  constructor(onChange=()=>{}){this.onChange=onChange;this.running=false;this.loading=false;this.revving=false;this.volume=.4;this.muted=false;this.generation=0;this.revCount=0;this.sources=new Set();this.abort=new AbortController();}
  get status(){return {running:this.running,loading:this.loading,revving:this.revving,volume:this.volume,muted:this.muted,context:this.ctx?.state||'uninitialized',loaded:!!this.buffers,revCount:this.revCount};}
  changed(){this.onChange(this.status);}
  async start(){
    if(this.running||this.loading)return;
    const generation=++this.generation;this.loading=true;this.changed();
    try{
      if(!this.ctx){const Context=window.AudioContext||window.webkitAudioContext;if(!Context)throw new Error('Audio playback is unavailable in this browser.');this.ctx=new Context();this.master=this.ctx.createGain();this.master.gain.value=0;this.analyser=this.ctx.createAnalyser();this.analyser.fftSize=256;this.meter=new Uint8Array(this.analyser.frequencyBinCount);const limiter=this.ctx.createDynamicsCompressor();limiter.threshold.value=-12;limiter.ratio.value=4;this.master.connect(limiter);limiter.connect(this.analyser);this.analyser.connect(this.ctx.destination);}
      await this.ctx.resume();
      if(!this.buffers)this.buffers=await Promise.all(['idle','rev','rev-long'].map(async name=>{const res=await fetch(`/audio/exhaust-${name}.mp3`,{signal:this.abort.signal});if(!res.ok)throw new Error('The exhaust recording could not be loaded.');return this.ctx.decodeAudioData(await res.arrayBuffer());}));
      if(generation!==this.generation)return;
      this.running=true;this.loading=false;this.idleGain=this.ctx.createGain();this.idleGain.gain.value=.62;this.idleGain.connect(this.master);this.idle=this.source(this.buffers[0],this.idleGain,true);this.applyVolume();this.changed();
    }catch(e){if(generation===this.generation){this.loading=false;this.running=false;this.changed();throw e;}}
  }
  source(buffer,gain,loop=false){const source=this.ctx.createBufferSource();source.buffer=buffer;source.loop=loop;source.connect(gain);this.sources.add(source);source.onended=()=>{this.sources.delete(source);source.disconnect();gain.disconnect();};source.start();return source;}
  rev(){
    if(!this.running||this.revving)return;
    this.revving=true;this.revCount++;const generation=this.generation,now=this.ctx.currentTime;
    this.idleGain.gain.cancelScheduledValues(now);this.idleGain.gain.setTargetAtTime(.08,now,.10);
    const gain=this.ctx.createGain();gain.gain.value=.82;gain.connect(this.master);
    const source=this.source(this.buffers[this.revCount%2?1:2],gain);this.revSource=source;
    source.onended=()=>{this.sources.delete(source);source.disconnect();gain.disconnect();if(this.generation!==generation||!this.running)return;this.revving=false;this.revSource=null;this.idleGain.gain.setTargetAtTime(.62,this.ctx.currentTime,.16);this.changed();};this.changed();
  }
  applyVolume(){if(!this.ctx||this.ctx.state==='closed')return;const now=this.ctx.currentTime;this.master.gain.cancelScheduledValues(now);this.master.gain.setTargetAtTime(this.running&&!this.muted?this.volume:0,now,.035);}
  setVolume(v){this.volume=Math.max(0,Math.min(1,Number(v)||0));this.applyVolume();this.changed();}
  setMuted(v){this.muted=!!v;this.applyVolume();this.changed();}
  stop(){this.generation++;this.running=false;this.loading=false;this.revving=false;if(this.ctx){this.applyVolume();for(const source of this.sources){try{source.stop(this.ctx.currentTime+.12);}catch{}}}this.idleGain=null;this.idle=null;this.revSource=null;this.changed();}
  levels(){if(!this.running||this.muted||!this.analyser)return new Array(12).fill(0);this.analyser.getByteFrequencyData(this.meter);return Array.from({length:12},(_,i)=>this.meter[Math.min(this.meter.length-1,2+i*4)]/255);}
  dispose(){this.stop();this.abort.abort();this.ctx?.close();}
}

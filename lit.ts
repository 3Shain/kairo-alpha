import {html, render,TemplateResult} from 'lit-html';
import { Behavior, BehaviorStream } from './reactive';

type BehaviorType<T> = T extends Behavior<infer G> ? G : T;

type Infer<T> = {
  [P in keyof T]: BehaviorType<T[P]>;
};

export function defineElement<T extends {[key:string]:BehaviorStream<any>|Function}>(
  fn:()=>T,
  temp:(props:Infer<T>)=>TemplateResult
){

  const updateTemplate = (p:Infer<T>)=>{
    render(temp(p),document.body);
  }

  const g = fn();
  let out:any = {};
  for(let key in g){
    if(typeof g[key] === "function"){
      out[key] = g[key];
    } else if(g[key] instanceof BehaviorStream){ // is behavior
      out[key] = (g[key] as BehaviorStream<unknown>).value;
      (g[key] as BehaviorStream<unknown>).addListener({
        emit(v){
          out[key] = (g[key] as BehaviorStream<unknown>).value;
          updateTemplate(out);
        }
      })
    }
  }
  updateTemplate(out);
}
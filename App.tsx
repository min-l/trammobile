import React, { useEffect, useState } from 'react';
import {Text, View, ScrollView, SafeAreaView, StyleSheet, Dimensions, FlatList, StyleProp, ViewStyle, VirtualizedList} from 'react-native';
import Svg, {Line, Path, SvgUri, SvgXml} from 'react-native-svg';
import Mapsvg from './mintytram2b.svg';
import Tramicon from './tramicon.svg';
import { err } from 'react-native-svg/lib/typescript/xml';

const map = require('./coords.json');

type Tram = {
  departed: string,
  predictNext: string,
  destination: string,
  route: string,
  dTime: string,
  currentTime: string,
  totalTime: string,
  progress: number,
  minuteOffset: number
}

const windowDimensions = Dimensions.get('window');
const scaling = {
  width: windowDimensions.width/100,
  height: windowDimensions.width/100,
  woffset: -7.5,
  hoffset: 12.5
};

/*
const Trams = () => {
  useEffect(() => {
    fetch('http://3.10.246.250:3000/active')
    .then((res) => res.json())
    .then()
  })
}
*/

function getLength(path: Array<string>) {
  let rLength = 0;
  path.forEach(segment => {
    switch (segment[0]) {
      case 'm':
        break;
      case 'h':
      case 'v':
        rLength += Math.abs(+segment.slice(1));
        break;
      case 'r':
      case 'd':
        rLength += Math.abs(+ (Math.abs(+segment.slice(1).split(' ')[0]) * Math.PI / 2));
        break;
    }
  });
  return rLength;
}

function getColour(c:boolean){
  switch(c) {
    case true:
      return 'green';
    case false:
      return 'orange';
  }
}

function getText(c:boolean) {
  switch(c) {
    case true:
      return 'Connected';
    case false:
      return 'Can\'t connect to server.';
  }
}

function getPosition(tram: any) {
  let output:StyleProp<ViewStyle> = {
    position:'absolute',
    top:'0%',
    left:'0%'
  };
  let path:Array<string>;
  let percent,length:number;
  percent = tram.progress;
  try {
    path = map[tram.departed][tram.predictNext];
    if (path == undefined) {
      percent = 1 - percent;
      path = map[tram.predictNext][tram.departed];
      if (path == undefined) {
        path = ["m100 600"];
      }
    }
    
  } catch {
    // console.log('FUCK');
    path = ["m100 600"];
    percent = 0;
  }
  // percent = 1;
  // console.log(path);
  length = getLength(path);
  length = length * percent; 
  let x = 0,y=0;
  path.forEach(segment => {
    let movement,smLength,cx,cy;
    switch (segment[0]) {
      case 'm':
        x = +segment.slice(1).split(' ')[0];
        y = +segment.slice(1).split(' ')[1];
        break;
      case 'h':
        movement = Math.sign(+segment.slice(1)) * Math.min(Math.abs(+segment.slice(1)),length);
        x += movement;
        length -= Math.abs(movement);
        break;
      case 'v':
        movement = Math.sign(+segment.slice(1)) * Math.min(Math.abs(+segment.slice(1)),length);
        y += movement;
        length -= Math.abs(movement);
        break;
      case 'r':
        cx = +segment.slice(1).split(' ')[0];
        cy = +segment.slice(1).split(' ')[1];
        smLength = Math.abs(+ (+cx * Math.PI / 2));
        movement = Math.min(smLength,length);
        /*angle = Math.sin(((movement / smLength)*Math.PI)-Math.PI/2)/2 + 0.5;
        angle = Math.sin(((movement / smLength)*Math.PI)/2);*/
        x = x + (cx * Math.sin(((movement / smLength)*Math.PI)/2));
        y = y + (cy * (Math.sin((((movement / smLength)*Math.PI)/2)-(Math.PI/2))+1));
        length -= movement;
        break;
      case 'd':
        cx = +segment.slice(1).split(' ')[0];
        cy = +segment.slice(1).split(' ')[1];
        smLength = Math.abs(+ (+cx * Math.PI / 2));
        movement = Math.min(smLength,length);
        /*angle = Math.sin(((movement / smLength)*Math.PI)-Math.PI/2)/2 + 0.5;
        angle = Math.sin(((movement / smLength)*Math.PI)/2);*/
        y = y + (cy * Math.sin(((movement / smLength)*Math.PI)/2));
        x = x + (cx * (Math.sin((((movement / smLength)*Math.PI)/2)-(Math.PI/2))+1));
        length -= movement;
        break;
    }
  })
  /*output.left = x + '%';
  output.top = y + '%';*/
  output.left = (x * scaling.width) + scaling.woffset;
  output.top = (y * scaling.height) + scaling.hoffset;
  return output;
}


const App = () => {
  const [trams, setTrams] = useState([]);
  const [connected, setConnected] = useState(true);
  useEffect(() => {
    setInterval(() => {
      fetch('http://3.10.246.250:3000/active')
      .then((res) => res.json())
      .then((data) => {
        setTrams(data);
        setConnected(true);
        console.log('data fetched successfully')
      }) 
      .catch((err) => {
        setConnected(false);
        console.log(err.message);
      });
    },5000);
  }, []);


  return (
    <SafeAreaView style={{backgroundColor: '#FFFFFF'}}>
      <View style={{
        backgroundColor: getColour(connected),
        width: '100%',
        height: 20
      }}>
        <Text style={{textAlign: 'center'}}>{getText(connected)}</Text>
      </View>
      <ScrollView>
        <Text style={{color:'#000000'}}>{windowDimensions.height},{windowDimensions.width},{windowDimensions.scale}</Text>
        <Mapsvg width={windowDimensions.width} height={windowDimensions.width*6}/>
        {trams.map((item, index) => <Tramicon key={index} width={15} height={15} style={getPosition(item)}/>)}
        {/*<Text style={{color:'black'}}>{JSON.stringify(trams)}</Text>*/}
      </ScrollView>
    </SafeAreaView>
  );
};
/*
const getItem = (data:any,index:number) => {
  return {
    id: index,

  }
}
*/
const styles = StyleSheet.create({
  text: {
    fontSize: 40,
  }
});

export default App;
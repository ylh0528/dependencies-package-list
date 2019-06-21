#!/usr/bin/env node
const fs = require('fs');
const process = require('process');
const program = require('commander');
const chalk = require('chalk');
const glob = require('glob');

const red = chalk.bold.red;
const blue = chalk.blue;
const green = chalk.green;
const yellow = chalk.yellow;

const defaultFileName = 'dependencies-package.log';



program
  .version('1.0.0')
  .option('-d , --detail', '根据package-lock.json生成依赖列表')
  .option('--output [value]', '生成文件目录地址')
  .option('-n , --filename [value]', '生成文件名')
  .parse(process.argv);
const destPath = program.args[0];

// 校验路径
if (destPath === undefined) {
  console.error(red("ERR: Path is required!"));
  process.exit(1);
}

program.detail = program.detail ? program.detail : false;
program.output = program.output ? program.output : destPath;
program.filename = program.filename ? program.filename : defaultFileName;
// const output = output.replace(/\/$/,'');
const output = program.output.replace(/\/$/,'') + '/' + program.filename.replace(/^\//,'');



// 写入列表
const writeLog = (log_path, content, clear,) => {
  if (clear === 'clear'){
    if (fs.existsSync(output)) {
      fs.unlinkSync(output);
    }
  }
  if (typeof content !== "string") {
    console.error(red('ERR: 输出文件类型必须为string'));
    process.exit(1);
  }
  const stat = fs.existsSync(log_path);
  if (!stat) {
    fs.writeFileSync(log_path, content);
  } else {
    fs.appendFileSync(log_path, content);
  }
}

// const destPath = program.args[0];

const stat = fs.statSync(destPath);

if (stat.isFile()) {
  console.error(red('ERR: Path is a file.'));
  process.exit(1);
}

const rootlog = fs.existsSync(output);
if (rootlog) {
  fs.unlinkSync(output);
}

if (program.detail) {
  console.log(yellow('从package-lock.json生成依赖列表'));

  const pacage_lock_json = fs.existsSync(`${destPath}/package-lock.json`);

  if (pacage_lock_json) {
    
    const lockstr = fs.readFileSync(`${destPath}/package-lock.json`).toString();

    const lockjson = JSON.parse(lockstr);

    const dep = lockjson.dependencies;

    for (let key in dep) {
      const keyVersion = dep[key].version;
      let strPackage = JSON.stringify({[key]:keyVersion})+',\n';
      writeLog(output,strPackage );
      const requires = dep[key].requires;
      if (requires){
        for (let key in requires) {
          const keyVersion = requires[key];
          let strPackage = JSON.stringify({[key]:keyVersion}) + ',\n';
          writeLog(output,strPackage );
        }
      }
    };

    const logstr = fs.readFileSync(output).toString().replace(/\,\n$/,'');

    const logArr = logstr.split(',');
    
    fs.unlinkSync(output);
    const cache = {};
    logArr.map((data,index)=>{
      const parseData =  JSON.parse(data);
      for( let keys in parseData){
        if (!cache[keys]) {
          writeLog(output,JSON.stringify(parseData)+',\n');
          cache[keys] = 1;
        }
      }
    })
    // writeLog(output,logArr,'clear' )
    console.log(green('依赖文件目录已生成,文件路径：'+output));
  } else {
    console.error(red("ERR: no such file or directory: package-lock.json"));
    process.exit(1);
  }
} else {
  console.log(yellow('从node_modules生成依赖列表'));
  const node_modules = fs.existsSync(`${destPath}/node_modules`);
  if (node_modules) {
    const modulesList = fs.readdirSync(`${destPath}/node_modules`);
    modulesList.map((data,index) => {
      const packagejson = fs.existsSync(`${destPath}/node_modules/${data}/package.json`);
      if (packagejson) {
        const datastring = JSON.stringify({[data]: JSON.parse(fs.readFileSync(`${destPath}/node_modules/${data}/package.json`).toString()).version}) + ',\n';
        writeLog(output,datastring);
      }
    })
    console.log(green('依赖文件目录已生成,文件路径：'+output));
  } else {
    console.error(red("ERR: 项目未添加依赖，请确认项目已安装依赖（node_modules)后再执行本脚本！或确认项目内包含package-lock.json时，执行dep-package path -d。"))
  }
}

const subProcess = require('child_process');

const topics = [];

// BASH COMMAND
module.exports = {

    launch_roscore : function() {
        let roscore = subProcess.spawn(
            "roscore"
        );

        roscore.on('message', (data) => {
            console.log(`data : ${data}`);
        });
    
        roscore.on('exit', (code, signal) => {
            if (code) {
                console.error('roscore exited with code', code);
                return;
            } else if (signal) {
                console.error('roscore was killed with signal', signal);
                return;
            }
    
            console.log('be sure to have closed all roscore process, it will be restart in a few seconds');
    
            setTimeout(() => {
                this.launch_roscore();
            }, 5000);
        });

       return roscore;
    },

    launch_mongodb : function(path, port) {
        let mongodb = subProcess.spawn(
            `HOSTNAME=localhost roslaunch mongodb_store mongodb_store.launch db_path:=${path} db_port:=${port}`,
            {shell : true, detached : true}
        );

        mongodb.stdout.on("data", (data) => {
            console.log(`read data from mongodb : ${data}`);
        });

        mongodb.stdout.on("error", (data) => {
            console.log(`error from mongodb server : ${data}`);
        });

        mongodb.on('exit', (code, signal) => {
            if (code) {
                console.error('mongodb server exited with code', code);
                return;
            } else if (signal) {
                console.error('mongodb server was killed with signal', signal);
                return;
            }
            console.log(`mongodb server exit normally`);
        });

        console.log("SERVER MONGODB START");

        return mongodb;
    },

    info_rosbag : function(path) {
        let info = subProcess.spawnSync(
            `rosbag info ${path}.bag`,
            {shell : true}
        );

        let result = info.output.toString();
        let string = result.slice(result.search("topics"), result.length - 2);

        string.split('\n').slice(2).forEach(topic => {
            let split = topic.trim().split(' ')[0];
            if (split.indexOf("image_raw") >= 0)
                topics.push(split);
        });
    },
    
    launch_log : function() {
        let log = subProcess.spawn(
            `rosrun mongodb_log mongodb_log.py` , 
            [topics.toString().replace(',', ' ')],
            {shell : true, detached : true}
        );

        log.on('exit', (code, signal) => {
            if (code) {
                console.error('log node exited with code', code);
                return;
            } else {
                console.error('log node was killed with signal', signal);
                return;
            }
        });

        log.stdout.on("data", (data) => {
            console.log(`read data from log node : ${data}`);
            // When the log node add succesfully the topics, then we can starts
            /*
            if (data.indexOf("GENERIC") >= 0)
                bag.stdin.write(" ");
            */
        });

        log.stdout.on("error", (data) => {
            console.log(`error from log node : ${data}`);
        });

        console.log("NODE LOG START");

        return log;
    },
    
    launch_rosbag_play : function(path) {
        //let space = true;
        let bag = subProcess.spawn(
            `rosbag play ${path}.bag`, 
            {shell : true, detached : true}
        );

        bag.stdout.on("error", (data) => {
            console.log(`error from file bag : ${data}`);
        });

        bag.stdout.on("data", (data) => {
            console.log(`read data from file bag : ${data}`);

            /*
            if (space) {
                space = false;
                bag.stdin.write(" ");
            }
            */
        });

        return bag;
    }
}
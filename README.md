# OrderBookingSystem
Self learning trading project - order booking system with nodejs

Step one:
docker run --name mongo4 -v $(pwd)/data:/data/db -d -p 27017:27017 --rm mongo:4.1
Run mongodb in docker: docker run --name some-mongo -d mongo:tag

Step two:
Run system with npm start

 // var order = new Order({ test: 'awesome' });
        // order.save(function (err) {
        //     if (err) return handleError(err);
        //     console.log(order + " saved to collection.");
        //   });
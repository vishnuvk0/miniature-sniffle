#useful commands to fix database errors

always make sure you reset the schema.prisma file with any changes you make.

then run this command

npx prisma migrate dev --name <name of migration> 

then make sure to stop the server and restart it.

then run the server again.
const electron = require('electron')
const path = require('path')
const sql = require('mssql')

$( "#menubar" ).mouseover(function() {
  	$( "#menulbl" ).show();
});

$( "#menubar" ).mouseout(function() {
  	$( "#menulbl" ).hide();
});

const config = {
    user: 'SA',
    password: 'password111!',
    server: 'localhost',
    database: 'CNBS_DEV',
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

const pool1 = new sql.ConnectionPool(config, err => {
    // ... error checks
 
    // Query
 
    pool1.request() // or: new sql.Request(pool1)
    .query('select * from Usuario', (err, result) => {
        // ... error checks
 
        console.dir(result);
        arreglo = result.recordset
        loadListUserTable()
    })
 
})

/*************** USUARIOS ***************/
/*var arreglo = [
	{Nombre: 'Dario', Apellido: 'Villalta', Correo: 'dda', Cargo: 'Admin', Departamento: 'D', Rol:'D'},
	{Nombre: 'Suamy', Apellido: 'Zorro', Correo: 'as', Cargo: 'Zorro', Departamento: 'D', Rol:'J'},
	{Nombre: 'Oscar', Apellido: 'TeBote', Correo: 'dsd', Cargo: 's', Departamento: 'C', Rol:'C'}];*/

var arreglo;

var userListClicked;

function loadListUserTable(){
	/*var html = ''
    for(var i = 0; i < arreglo.length; i++){
        html += '<tr><td>' + arreglo[i].Nombre + '</td><td>' + arreglo[i].Apellido + '</td><td>' + arreglo[i].Correo + '</td><td>' + arreglo[i].Cargo + '</td><td>' + arreglo[i].Departamento + '</td><td>' + arreglo[i].Rol + '</td><td><button type="button" class="btn btn-success" data-toggle="modal" href="#modalUpdate" onclick="setUserListClicked('+i+')"><span class="glyphicon glyphicon-pencil"></span></button></td><td><button type="button" class="btn btn-danger" onclick="setUserListClicked('+i+')"><span class="glyphicon glyphicon-trash"></span></button></td></tr>'
    }
	$('#tablaListUsers tr').first().after(html)*/
	var arraySelect2 = [];
	for(var i = 0; i < arreglo.length; i++){
		arraySelect2.push({id: arreglo[i].Nombre, text: arreglo[i].Nombre});
    }
	$( "#menulbl" ).hide();
	$("#departamentoUserAdd").select2({
		data: arraySelect2
	});
	var table = $('#tablaListUsers').DataTable({
		"dom": 'lCfrtip',
		"order": [],
		"colVis": {
			"buttonText": "Columns",
			"overlayFade": 0,
			"align": "right"
		},
		"language": {
			"lengthMenu": '_MENU_ entradas por página',
			"search": '<i class="fa fa-search"></i>',
			"paginate": {
				"previous": '<i class="fa fa-angle-left"></i>',
				"next": '<i class="fa fa-angle-right"></i>'
			},
			"loadingRecords": "Cargando...",
    		"processing":     "Procesando...",
    		"emptyTable":     "No hay información en la tabla",
		    "info":           "Mostrando _START_ a _END_ de un total _TOTAL_ de entradas",
		    "infoEmpty":      "Mostrando 0 a 0 de 0 entradas",
		    "infoFiltered":   "(filtrado de un total de _MAX_ entradas)"
		},
		"data": arreglo,
		"columns": [
	        { "data": "Nombre" },
	        { "data": "Apellido" },
	        { "data": "Correo" },
	        { "data": "Cargo" },
	        { "data": "Departamento" },
	        { "data": "Rol" },
	        { "data": "Modificar" },
	        { "data": "Eliminar" }
	    ],
	    "columnDefs": [ {
            "targets": -1,
            "defaultContent": '<button type="button" class="btn btn-danger buttonTableUserDele"><span class="glyphicon glyphicon-trash"></span></button>'
        },{
            "targets": -2,
            "defaultContent": '<button type="button" class="btn btn-success buttonTableUserEdit" data-toggle="modal" href="#modalUpdate"><span class="glyphicon glyphicon-pencil"></span></button>'
        } ]
	});
	$('#tablaListUsers tbody').on( 'click', 'button.buttonTableUserEdit', function () {
        var data = table.row( $(this).parents('tr') ).data();
        console.log('1');
        console.log(data);
	    console.log(table.row( $(this).parents('tr') )[0]);
    } );
    $('#tablaListUsers tbody').on( 'click', 'button.buttonTableUserDele', function () {
        var data = table.row( $(this).parents('tr') ).data();
        console.log('22');
        console.log(data);
	    console.log(table.row( $(this).parents('tr') )[0]);
    } );
}

function setUserListClicked (pos) {
	userListClicked = pos;
}

/*var user = sql.define({
  	name: 'Usuario',
  	columns: ['Nombre', 'Apellido', 'Cargo', 'Departamento', 'Rol', 'Password', 'Correo']
});*/

function createUser () {
	var name = $("#nombreUserAdd").val();
	var lastname = $("#apellidoUserAdd").val();
	var charge = $("#cargoUserAdd").val();
	var department = $("#departamentoUserAdd").val();
	var role = $("#rolUserAdd").val();
	var password = $("#passwordUserAdd").val();
	var email = $("#correoUserAdd").val();
	toastr.clear();
	toastr.options.positionClass = "toast-top-full-width";
	toastr.options.progressBar = true;
	toastr.options.showEasing = 'swing';
	toastr.options.hideEasing = 'swing';
	toastr.options.showMethod = 'slideDown';
	toastr.options.hideMethod = 'slideUp';

	//pool1.close();

	if(name.length >= 3){
		if(lastname.length >= 3){
			if(isValidEmailAddress(email)){
				if(password.length >= 5){
					if(role.length >= 3){
						if(department.length > 0){
							if(role.length > 0){
								const transaction = new sql.Transaction( pool1 );
								transaction.begin(err => {
									var rolledBack = false
							 
								    transaction.on('rollback', aborted => {
								        // emited with aborted === true
								 
								        rolledBack = true
								    })
								    const request = new sql.Request(transaction);
								    request.query("insert into Usuario (Nombre, Apellido, Cargo, Departamento, Rol, Password, Correo) values ('"+name+"', '"+lastname+"', '"+charge+"', '"+department+"', '"+role+"', '"+password+"', '"+email+"')", (err, result) => {
								    	if (err) {
								    		if (!rolledBack) {
								    			console.log('error en rolledBack');
								    			transaction.rollback(err => {
								                    // ... error checks
								                });
								    		}
								    	}  else {
									        transaction.commit(err => {
									        	// ... error checks
									            console.log("Transaction committed.");
									            console.log(result);
									        });
									    }
								    });
								}); // fin transaction
							} else
								toastr.error('Ingrese un rol válido.', 'Error');
						} else
							toastr.error('Ingrese un departmento válido.', 'Error');
					} else
						toastr.error('Ingrese un cargo válido.', 'Error');
				} else
					toastr.error('Ingrese una contraseña válida.', 'Error');
			} else
				toastr.error('Ingrese un correo válido.', 'Error');
		} else
			toastr.error('Ingrese un apellido válido.', 'Error');
	} else
		toastr.error('Ingrese un nombre válido.', 'Error');
}

function isValidEmailAddress(emailAddress) {
    var pattern = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    console.log(emailAddress.toLowerCase());
    console.log(pattern.test(emailAddress.toLowerCase()));
    return pattern.test(emailAddress.toLowerCase());
}
/*************** END USUARIOS ***************/

/*************** DEPARTAMENTOS ***************/
var esDepartamentoAdd = true;

function loadListDepartmentTable(){
	/*var html = ''
    for(var i = 0; i < arreglo.length; i++){
        html += '<tr><td>' + arreglo[i].Nombre + '</td><td>' + arreglo[i].Apellido + '</td><td>' + arreglo[i].Correo + '</td><td>' + arreglo[i].Cargo + '</td><td>' + arreglo[i].Departamento + '</td><td>' + arreglo[i].Rol + '</td><td><button type="button" class="btn btn-success" data-toggle="modal" href="#modalUpdate" onclick="setUserListClicked('+i+')"><span class="glyphicon glyphicon-pencil"></span></button></td><td><button type="button" class="btn btn-danger" onclick="setUserListClicked('+i+')"><span class="glyphicon glyphicon-trash"></span></button></td></tr>'
    }
	$('#tablaListUsers tr').first().after(html)*/
	$('#comiteAddlbl').hide();
	$('#coordAddlbl').hide();
	$("#jefeAdd").select2();
}

function showLabel (isDepart) {
	if(isDepart){
		$('#departamentoAddlbl').show();
		$('#comiteAddlbl').hide();
		$('#jefeAddlbl').show();
		$('#coordAddlbl').hide();
	} else{
		$('#departamentoAddlbl').hide();
		$('#comiteAddlbl').show();
		$('#jefeAddlbl').hide();
		$('#coordAddlbl').show();
	}
}

loadListDepartmentTable()
/*************** END DEPARTAMENTOS ***************/

/*************** COMPONENTES ***************/

function loadListComponentTable(){
	/*var html = ''
    for(var i = 0; i < arreglo.length; i++){
        html += '<tr><td>' + arreglo[i].Nombre + '</td><td>' + arreglo[i].Apellido + '</td><td>' + arreglo[i].Correo + '</td><td>' + arreglo[i].Cargo + '</td><td>' + arreglo[i].Departamento + '</td><td>' + arreglo[i].Rol + '</td><td><button type="button" class="btn btn-success" data-toggle="modal" href="#modalUpdate" onclick="setUserListClicked('+i+')"><span class="glyphicon glyphicon-pencil"></span></button></td><td><button type="button" class="btn btn-danger" onclick="setUserListClicked('+i+')"><span class="glyphicon glyphicon-trash"></span></button></td></tr>'
    }
	$('#tablaListUsers tr').first().after(html)*/
	$("#selectDepartComp").select2();
}

loadListComponentTable()

/*************** END COMPONENTES ***************/

/*************** ELEMENTOS ***************/

function loadListElementTable(){
	/*var html = ''
    for(var i = 0; i < arreglo.length; i++){
        html += '<tr><td>' + arreglo[i].Nombre + '</td><td>' + arreglo[i].Apellido + '</td><td>' + arreglo[i].Correo + '</td><td>' + arreglo[i].Cargo + '</td><td>' + arreglo[i].Departamento + '</td><td>' + arreglo[i].Rol + '</td><td><button type="button" class="btn btn-success" data-toggle="modal" href="#modalUpdate" onclick="setUserListClicked('+i+')"><span class="glyphicon glyphicon-pencil"></span></button></td><td><button type="button" class="btn btn-danger" onclick="setUserListClicked('+i+')"><span class="glyphicon glyphicon-trash"></span></button></td></tr>'
    }
	$('#tablaListUsers tr').first().after(html)*/
	$("#selectCompleElemAdd").select2();
}

loadListElementTable()

/*************** END ELEMENTOS ***************/
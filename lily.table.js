/**
 * jQuery button - v1.0
 * auth: shenmq
 * E-mail: rsa.cmbc.com.cn
 * website: shenmq.github.com
 *
 */
  
(function( $, undefined ){

	"use strict"

 	/* BUTTON PUBLIC CLASS DEFINITION
	 * ============================== */

	var Table = function ( element, options ) {
		this.init(element, options );
	}

	Table.prototype = {
	
		constructor: Table,
		
		localization: {
			totalPage: '共',
			page: '页',
			jump: '跳转到',
			pageNo: '第',
			nextPage: '>',
			prevPage: '<',
			jumpPage: 'Go',
			noMessage : '查询无记录',
			logRecordFlag:'N'       //不需要记日志标志
		},
		
		
		init: function(element, options) {
			
			this.$element = $(element);
			this.options = $.extend({}, $.fn.table.defaults, options);
			
			this._turnPageShowNum = this.options.turnPageShowNum;
			
			this.tableBody = $('tbody' , this.$element);
			
			if ( this.options.barPosition ) {
				this.barElement = $('<div class="' + this.options.turnPageBarClass +'" ></div>');
				
				switch( this.options.barPosition ) {
					case "top": {
						this.barElement.insertBefore(this.$element);
						break;
					}
					case "bottom": {
						this.barElement.insertAfter(this.$element);
						break;
					}
				}
				if(this.options.hideturnPageBar){
					this.barElement.hide();
				}
				
			}
			this.setFormat();
			this.halfShowPagesNum = parseInt(this.options.showPagesNum / 2 );
			if(this.options.loadDataAtInit)
				this.beginQuery(this.options.parameter);
		},
		
		beginQuery: function(requestData) {
			this.isBeginQuery = true;
			if(this.responseData&&this.responseData.turnPageHeadFlag){
				this.responseData.turnPageHeadFlag = null;
			};
			if(requestData){
				if('turnPageShowNum' in requestData){
					this.options.turnPageShowNum=requestData.turnPageShowNum;
					
					this._turnPageShowNum=requestData.turnPageShowNum;
				}
			}
			this.requestData = $.extend(requestData, {turnPageShowNum: this._turnPageShowNum});
			this.dataQuery( 0 );
			this.turnPageCurrentPage = 1;
		},
		
		dataQuery: function(beginPos,logRecordFlag, callback) {
			var self = this;
			
			var requestData = $.extend(this.requestData, {turnPageBeginPos: beginPos+1});
			/*if(logRecordFlag){
				requestData=$.extend(this.requestData, {logRecordFlag: this.localization.logRecordFlag});
				if(this.responseData){
					requestData=$.extend(this.requestData, {RcvFileNme: this.responseData.RcvFileNme});
				}
			}分页不记录日志的方法，以后要删除采用别的方法*/
			
			//在返回数据中添加turnPageHeadFlag标识，则可以一次性返回所有数据，仅限于小量数据
			if(this.responseData && this.responseData.turnPageHeadFlag){
				var newIcollName = self.nowPageIcoll(this.responseData[self.options.iCollName],beginPos);
				
				self.clearTableBody();
				self.addRowsIcoll(newIcollName);
				self.dataSource = newIcollName;
				callback();
				if(self.options.afterQueryCall) {					
					self.options.afterQueryCall();
				}
                /*if(self.options.resizeQueryWindowHeight) {
                	resizeQueryWindowAddheight(self.options.resizeQueryWindowHeight);
				}*/
			}else{
			  $.lily.ajax({
				url: this.options.url, 
				data: requestData,
				processResponse: function ( data ) {
					if(data.turnPageHeadFlag){
						var newIcoll = self.nowPageIcoll(data[self.options.iCollName],beginPos);
						self.processContextData(data,newIcoll);
					}else{
						self.processContextData(data);
					}
					
					if(callback)
						callback();
					if(self.options.afterQueryCall) {
						
						self.options.afterQueryCall();
					}
                  /*  if(self.options.resizeQueryWindowHeight) {
						
                    	resizeQueryWindowAddheight(self.options.resizeQueryWindowHeight);
					}*/
				}
			});
			}
		},
		nowPageIcoll: function(oldIcoll,beginPois) {
			
			var showNum =parseInt(this.requestData.turnPageShowNum);
			
			
			var newIcollName = [];
			if(!beginPois){
				beginPois = 0;
			}
			for ( var j = beginPois; j <beginPois+showNum; j++) {
				if(oldIcoll.length>j){
					newIcollName.push(oldIcoll[j]);
				}
			}
			
			return newIcollName;
		},
		
		queryProxy: function( e ) {
			var self = this;
			this.isBeginQuery = false;
			var $btn = $(e.target);
			
			if($btn.hasClass('disabled') || $btn.hasClass('active'))
				return;
			
			var queryType = $btn.attr('data-content');
			switch(queryType) {
				case 'prev':
					var beginIndex = this.turnPageCurrentPage - 1;
					beginPos = (beginIndex-1) * this.options.turnPageShowNum;
					this.dataQuery(beginPos, true,function() {
						self.turnPageCurrentPage = parseInt(beginIndex);
						self.updatePageBar(beginIndex);
					});
					break;
				case 'next':
					var beginIndex = this.turnPageCurrentPage + 1;
					beginPos = (beginIndex-1) * this.options.turnPageShowNum;
					this.dataQuery(beginPos,true, function() {
						self.turnPageCurrentPage = parseInt(beginIndex);
						self.updatePageBar(beginIndex);
					});
					break;
				case 'jump':
					var beginTemp = $('input', this.barElement)[0].value ;
					
					if(!$.lily.format.isInteger(beginTemp)){
						$('input', this.barElement)[0].value='';
						return;
					}
						
					var beginIndex = parseInt(beginTemp);
					if(beginIndex < 1 || beginIndex > this._turnPageTotalPage || beginIndex == this.turnPageCurrentPage)
						return;
					beginPos = parseInt(beginIndex-1) * this.options.turnPageShowNum;
					this.dataQuery(beginPos,true, function() {
						self.turnPageCurrentPage = parseInt(beginIndex);
						self.updatePageBar(self.turnPageCurrentPage);
					});
					break;
				default:
					var beginIndex = parseInt(queryType);
					var beginPos = (beginIndex-1) * this.options.turnPageShowNum;
					this.dataQuery(beginPos,true, function() {
						self.turnPageCurrentPage = parseInt(beginIndex);
						self.updatePageBar(self.turnPageCurrentPage);
					});
					break;
			}
			
		},
		
		updatePageBar: function(beginIndex) {
			this.genTurnPageElement(beginIndex);
			this.turnPageCurrentPage = beginIndex;
			if(this.turnPageCurrentPage == '1')
				this.barElement.find('[data-content="prev"]').addClass('disabled');
			else 
				this.barElement.find('[data-content="prev"]').removeClass('disabled');
			
			if(this.turnPageCurrentPage == this._turnPageTotalPage)
				this.barElement.find('[data-content="next"]').addClass('disabled');
			
			else if(this._turnPageTotalPage != '1')
				this.barElement.find('[data-content="next"]').removeClass('disabled');
				
			this.barElement.find('.active').removeClass('active');
			this.barElement.find('[data-content="' + beginIndex + '"]').addClass('active');
		},
		
		processContextData: function(contextData,newIcoll) {
			
			this._turnPageTotalNum = contextData[this.options.turnPageTotalNum];
			
			
				if( this.isBeginQuery )
					this.genTurnPageElement(1);
			
			var iColl = contextData[this.options.iCollName];
			if(newIcoll){
				iColl = newIcoll;
			}
			this.clearTableBody();
			this.dataSource = iColl;
			this.responseData = contextData;
			this.addRowsIcoll(iColl);
			
		},
		
		clearTableBody: function() {
			this.tableBody.children().remove();
		},
		
		addRowsIcoll : function( icoll ) {
			if ( icoll == null ){
				alert( "Table: Can't get "+this.options.icollName+" from context!");
				return;
			}
			var self = this;
			if(icoll.length==0){
				var row = $('<tr class="bg1" align="center"></tr>');
				var colspanNoRecord=this.columnFormatArray.length;
				
				if(this.options.enableSelect){
					colspanNoRecord+=1;
				}
				row.append("<td colspan='"+colspanNoRecord+"' style='text-align: center;'>"+this.localization.noMessage+"</td>");
				this.tableBody.append(row);
			}
			
			for (var rowIndex = 0, leng = icoll.length; rowIndex < leng; rowIndex++) {
				var kColl = icoll[rowIndex];
				
				var row = $('<tr class="bg' + (rowIndex % 2 + 1) + '" align="center"></tr>');
				
				row.data("dataSource", kColl);
				
				if ( this.options.enableMouseEvent ) {
					row.bind('mouseover.table', function(){ $(this).addClass( "rowMoveover" ) } ); 
					row.bind('mouseout.table', function(){ $(this).removeClass( "rowMoveover" ) } ); 
				}
				
				if ( this.options.enableSelect ) {
					
					var $selectTD = $('<td data-toggle="notprint" ></td>');
					row.append( $selectTD );
					
					var $selectElement;
					
					if(this.options.enableMutiSelect) {
						$selectElement = $('<div class="checkbox"></div>');
					}
					else {
						$selectElement = $('<div class="radio"></div>');
					}
					$selectTD.append($selectElement);
					
					row.bind('click.table', function() {
						var $this = $(this);
						if($this.hasClass('active')) {
							$this.removeClass( "active" );
							if(!self.options.enableMutiSelect) {
								$this.find(".radio").toggleClass("checked");
							}
							else {
								$this.find(".checkbox").toggleClass("checked");
							}
							return;
						}
						if(!self.options.enableMutiSelect) {
							self.tableBody.children('.active').find(".radio").removeClass("checked");
							self.tableBody.children('.active').removeClass('active');
							$this.find(".radio").toggleClass("checked");
						}
						else {
							$this.find(".checkbox").toggleClass("checked");
						}
						$this.addClass( "active" );
					});
				}
				
				for (var cellIndex = 0, colNum = this.columnFormatArray.length; cellIndex < colNum; cellIndex++) {
					var format = this.columnFormatArray[cellIndex];
					
					// 根据定义好的格式输出
					var output;
					
					if ( format.key == null || format.dataProvider ) {
						output = format.formatter( cellIndex, kColl,rowIndex );
						if (!output) {
							output = '';
						}
					}
					else {
						var keyData = kColl[format.key];
						if (!keyData) {
							output = '';
						} 
						else if(format.appType) {
							output = format.formatter(format.appType, keyData);
							if (!output ) {
								output = '';
							}
						}
						else {	
							output = format.formatter( keyData, kColl );
							if (!output ) {
								output = '';
							}
						}
					}
					var tdElement = $('<td></td>');
					
					row.append( tdElement );
					
					if ( typeof output === "object" ) {
						tdElement.append( output );
					} 
					else {
						tdElement.text( output );
					}
					if ( format.className ){
						tdElement.addClass(format.className);
					}
					if ( format.style ){
						tdElement.setStyle( format.style );
					}
					if ( false === format.enabled ) {
						tdElement.hide();
					}
				}
				
				this.tableBody.append(row);
			}
		},
		
		genTurnPageElement: function() {
			this.barElement.children().remove();
			if(this._turnPageTotalNum == 0 || isNaN(this._turnPageTotalNum)) {
				return;
			}
			// 总页数
			var turnPageTotalPage;
			
			if ( this._turnPageTotalNum % this._turnPageShowNum > 0 ) {
				turnPageTotalPage = parseInt( this._turnPageTotalNum / this._turnPageShowNum) + 1;
			}
			else{
				turnPageTotalPage = parseInt( this._turnPageTotalNum / this._turnPageShowNum);
			}
			this._turnPageTotalPage = turnPageTotalPage;
			
			
			if ( (this._turnPageTotalPage == 0 || isNaN(this._turnPageTotalPage)) && (this._turnPageTotalNum == 0 || isNaN(this._turnPageTotalNum)) ) {
				return null;
			}

			// 生成列表 
			var turnPageContainer = $("<div></div>");
			
			var turnPageDiv = $('<div class="fl"></div>');
			
			//上一页
			var prevPageButton = $('<button class="' + this.options.turnPageClass +'" data-content="prev">' + this.localization.prevPage + '</button>');
			
			prevPageButton.addClass('disabled');
			
			prevPageButton.bind("click.query", $.proxy(this.queryProxy, this) );
			
			turnPageDiv.append( prevPageButton );
			
			// 当前页(从1开始) 
			var turnPageStart = this.turnPageCurrentPage - this.halfShowPagesNum;
			if(turnPageStart < 1)
				turnPageStart = 1;
			
			// 是否可以翻到下一页
			var turnPageHasNextButton = turnPageStart < this._turnPageTotalPage;
			// 当前显示可供点击的开始页数 
			//var turnPageStart = parseInt( turnPageCurrentPage / this.options.turnPageShowNum ) * this.options.turnPageShowNum;
			//turnPageStart = ( turnPageStart == 0 ) ? 1: turnPageStart;
			
			// 当前显示可供点击的结束页数 
			var turnPageEnd = turnPageStart + this.options.showPagesNum -1 ;
			if ( turnPageEnd > this._turnPageTotalPage ) {
				if(turnPageStart > 1) {
					turnPageStart -= (turnPageEnd - this._turnPageTotalPage-1);
				}
				turnPageEnd = this._turnPageTotalPage;
			}
			

			if(turnPageStart != 1) {
				var pageElement = $('<button class="' + this.options.turnPageClass +'"  data-content="1">1</button>');
				pageElement.bind("click.query", $.proxy(this.queryProxy, this) );
				turnPageDiv.append( pageElement );
				if(turnPageStart != 2) {
					var omissionElement = $('<span>...</span>');
					turnPageDiv.append( omissionElement );
				}
			}
			
			for ( var i=turnPageStart; i <= turnPageEnd; i++ ) {
				if ( i == 1 ) {
					var pageElement = $('<button class="' + this.options.turnPageClass +' active"  data-content="' + i + '">' + i + '</button>');
					pageElement.bind("click.query", $.proxy(this.queryProxy, this) );
				}
				else{
					var pageElement = $('<button class="' + this.options.turnPageClass +'"  data-content="' + i + '">' + i + '</button>');
					
					pageElement.bind("click.query", $.proxy(this.queryProxy, this) );
				}
				turnPageDiv.append( pageElement );
			}
			

			if(turnPageEnd != this._turnPageTotalPage) {
				if((turnPageEnd + 1) != this._turnPageTotalPage) {
					var omissionElement = $('<span>...</span>');
					turnPageDiv.append( omissionElement );
				}
				
				var pageElement = $('<button class="' + this.options.turnPageClass +'"  data-content="' + this._turnPageTotalPage + '">' + this._turnPageTotalPage + '</button>');
				pageElement.bind("click.query", $.proxy(this.queryProxy, this) );
				
				turnPageDiv.append( pageElement );
				
			}
			
			//下一页
			var nextPageButton = $('<button class="' + this.options.turnPageClass +'" data-content="next">' + this.localization.nextPage + '</button>');
			if( !turnPageHasNextButton )
				nextPageButton.addClass('disabled');
				
			nextPageButton.bind("click.query", $.proxy(this.queryProxy, this) );
			turnPageDiv.append( nextPageButton );
			
			
			turnPageContainer.append(turnPageDiv);
			
			var jumpPageButton = $('<button class="' + this.options.jumpTurnPageClass +'" data-content="jump">' + this.localization.jumpPage + '</button>');;
			jumpPageButton.bind("click.query", $.proxy(this.queryProxy, this) );
			
			var jumpInputText = $('<input id="table-jump" type="text" class="' + this.options.inputPageClass +'" size="3" data-validate=\'{"id":"table-jump","name":"跳转页","type":"number"}\'/>');
			
			var jumpToText = this.localization.totalPage + this._turnPageTotalPage + this.localization.page + " " + this.localization.jump + this.localization.pageNo;
			var jumpTextSpan = $('<span class="turn-page-text">' + jumpToText + '</span>');
			var jumpDiv = $('<div class="fl" ></div>');
			jumpDiv.append(jumpTextSpan);
			jumpDiv.append(jumpInputText);
			jumpDiv.append($('<span class="turn-page-text" >' + this.localization.page +'</span>'));
			jumpDiv.append(jumpPageButton);
			turnPageContainer.append( jumpDiv );
			
			
			
			turnPageContainer.addClass(this.options.turnPageContainerClass);
			if(parseInt(this._turnPageTotalNum)>parseInt(this.options.turnPageShowNum)){
				this.barElement.append(turnPageContainer);
				this.barElement.validator();
			}
			
		},
		
		setFormat : function( formats ) {
			var formatArray = this.options.formatArray;
			if(formats) {
				formatArray = formats;
			}
			
			this.columnFormatArray = [];
			
			if( !formatArray || !$.isArray(formatArray) ){
				alert("Invalid format!");
				return;	
			}
			for (var index = 0, leng = formatArray.length; index < leng; index++) {
				var column = formatArray[index];
				var formatFunction = this.formatText;
				// 根据格式定义设置默认格式化的函数
				if ( column.format ){
					switch ( column.format ){
						case "date" : formatFunction = $.lily.format.formatDate;break;
						case "time" : formatFunction = $.lily.format.formatTime;break;
						case "dateTime" : formatFunction = $.lily.format.formatDateTime;break;
						case "currency" : formatFunction = $.lily.format.toCashWithComma;break;
						case "rate" : formatFunction = $.lily.format.toPercentRate;break;
						case "dataToDate" : formatFunction = $.lily.format.dataToDate;break;
						case "currencyWith0" : formatFunction = $.lily.format.toCashWithCommaReturn0;break;
					}
				}
				// 如果设置了自定义的格式化函数
				if ( column.formatter ){
					formatFunction = column.formatter;
				}
				if ( column.appType ){
					formatFunction = $.lily.param.getDisplay;
				}
				// 记录格式定义
				var columnFormat = {};
				$.extend( columnFormat, column);
				columnFormat.formatter = formatFunction;
				this.columnFormatArray.push(columnFormat);
			}
		},
		
		formatText : function( data, kcoll ){
			// 如果数据项为null或undefine
			if ( data ){
				return data;
			}else{
				return "";
			}
		},
		
		reloadIcoll: function() {
			
		},
		
		getSelectedItem: function() {
			var selectedItems = this.tableBody.children('tr.active');
			if(!selectedItems || selectedItems.length == 0)
				return null;
			if(this.options.enableMutiSelect) {
				var returnArry = [];
				$.each(selectedItems,function(){
					returnArry.push($(this).data('dataSource'));
				});
				return returnArry;
			}
			var test = $(selectedItems[0]).data('dataSource');
			return $(selectedItems[0]).data('dataSource');
		},
		
		getDataSource: function() {
			return this.dataSource;
		},
		
		getResponseData: function() {
			return this.responseData;
		}
	}
	
	$.fn.table = function ( option ) {
		return this.each(function () {
			var $this = $(this), 
				data = $this.data('table'), 
				options = typeof option == 'object' && option;
			if (!data) 
				$this.data('table', (data = new Table(this, options)));
		});
	}

  	$.fn.table.defaults = {
		turnPageShowNum: 10 ,
		showPagesNum: 4,
		hideturnPageBar:false,
		barPosition: 'bottom' ,
		turnPageTotalNum: 'turnPageTotalNum' ,
		turnPageBeginPos: 'turnPageBeginPos' ,
		rowClass: 'result-table-row' ,
		turnPageClass: 'turn-page-btn' ,
		jumpTurnPageClass: 'jump-turn-page' ,
		inputPageClass: 'input-page' ,
		turnPageBarClass: 'turn-page-bar',
		turnPageContainerClass: 'turn-page-container',
		parameter: null,
		enableMouseEvent: true,
		enableSelect: false,
		enableMutiSelect: false,
		loadDataAtInit: true,
		afterQueryCall: null,
		resizeQueryWindowHeight:null//此处填写currentElement
  	}

  	$.fn.table.Constructor = Table;
  	
})(jQuery)	